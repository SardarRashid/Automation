from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.concurrency import run_in_threadpool
import os
import shutil
import tempfile
import zipfile
import json
import requests
from typing import Optional

from processors import (
    ReportProcessor,
    DestructionProcessor,
    TransferOrderProcessor,
    InvoiceProcessor,
    EcomInvoiceProcessor,
    RequestFormProcessor
)

app = FastAPI(title="Inventory Suite API")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def cleanup_temp(temp_dir: str):
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)

def zip_directory(folder_path: str, zip_path: str):
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(folder_path):
            for file in files:
                if not file.endswith('.zip'):
                    zipf.write(os.path.join(root, file), file)

def get_excel_response(out_dir: str, temp_dir: str, background_tasks: BackgroundTasks):
    xlsx_files = [f for f in os.listdir(out_dir) if f.endswith('.xlsx')]
    if not xlsx_files:
        zip_path = os.path.join(temp_dir, "results.zip")
        zip_directory(out_dir, zip_path)
        background_tasks.add_task(cleanup_temp, temp_dir)
        return FileResponse(zip_path, filename="results.zip", media_type="application/zip")
    
    file_path = os.path.join(out_dir, xlsx_files[0])
    background_tasks.add_task(cleanup_temp, temp_dir)
    return FileResponse(
        file_path, 
        filename=xlsx_files[0], 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Access-Control-Expose-Headers": "Content-Disposition"}
    )

@app.get("/")
def read_root():
    return {"message": "Inventory Suite Backend is Running!"}

@app.post("/api/process-report")
async def process_report(
    background_tasks: BackgroundTasks,
    sap_file: UploadFile = File(...),
    loginext_file: UploadFile = File(...),
    remaining_file: Optional[UploadFile] = File(None),
    report_type: str = Form(...),
    profile_settings: str = Form("{}")
):
    temp_dir = tempfile.mkdtemp()
    
    sap_path = os.path.join(temp_dir, sap_file.filename)
    with open(sap_path, "wb") as f:
        f.write(await sap_file.read())
        
    log_path = os.path.join(temp_dir, loginext_file.filename)
    with open(log_path, "wb") as f:
        f.write(await loginext_file.read())
        
    rem_path = None
    if remaining_file:
        rem_path = os.path.join(temp_dir, remaining_file.filename)
        with open(rem_path, "wb") as f:
            f.write(await remaining_file.read())
            
    out_dir = os.path.join(temp_dir, "output")
    os.makedirs(out_dir, exist_ok=True)
    
    try:
        processor = ReportProcessor(
            sap_file=sap_path,
            loginext_file=log_path,
            output_folder=out_dir,
            report_type=report_type,
            remaining_file=rem_path
        )
        success, msg = await run_in_threadpool(processor.process)
        if not success:
            raise Exception(msg)
        
        return get_excel_response(out_dir, temp_dir, background_tasks)
        
    except Exception as e:
        cleanup_temp(temp_dir)
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/process-destruction")
async def process_destruction(
    background_tasks: BackgroundTasks,
    sap_file: UploadFile = File(...),
    destruction_file: UploadFile = File(...),
    profile_settings: str = Form("{}")
):
    temp_dir = tempfile.mkdtemp()
    
    sap_path = os.path.join(temp_dir, sap_file.filename)
    with open(sap_path, "wb") as f:
        f.write(await sap_file.read())
        
    dest_path = os.path.join(temp_dir, destruction_file.filename)
    with open(dest_path, "wb") as f:
        f.write(await destruction_file.read())
            
    out_dir = os.path.join(temp_dir, "output")
    os.makedirs(out_dir, exist_ok=True)
    
    try:
        profile = json.loads(profile_settings)
        processor = DestructionProcessor(
            sap_file=sap_path,
            destruction_file=dest_path,
            output_folder=out_dir,
            cost_center=profile.get("cost_center") or "1DMECD001",
            sloc=profile.get("sloc") or "DHDD",
            plant=profile.get("plant") or "DM01",
            warehouse=profile.get("warehouse") or "Dammam Club"
        )
        success, msg = await run_in_threadpool(processor.process)
        if not success:
            raise Exception(msg)
        
        return get_excel_response(out_dir, temp_dir, background_tasks)
        
    except Exception as e:
        cleanup_temp(temp_dir)
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/process-invoice")
async def process_invoice(
    background_tasks: BackgroundTasks,
    po_file: UploadFile = File(...),
    master_file: Optional[UploadFile] = File(None),
    profile_settings: str = Form("{}")
):
    temp_dir = tempfile.mkdtemp()
    
    po_path = os.path.join(temp_dir, po_file.filename)
    with open(po_path, "wb") as f:
        f.write(await po_file.read())
        
    profile = json.loads(profile_settings)
    if master_file:
        master_path = os.path.join(temp_dir, master_file.filename)
        with open(master_path, "wb") as f:
            f.write(await master_file.read())
    else:
        master_url = 'cloud-db' # Force cloud database
        master_path = profile.get("po_master_path", "").strip('\"\'')
        
        if master_url == 'cloud-db':
            rtdb_url = "https://automation-suit-cece7-default-rtdb.firebaseio.com/global_master_files/po_master_url.json"
            try:
                import requests
                import base64
                r = requests.get(rtdb_url, timeout=15)
                r.raise_for_status()
                data = r.json()
                if not data or not data.get("data"):
                    raise Exception("Data not found")
                master_path = os.path.join(temp_dir, "downloaded_master.xlsx")
                with open(master_path, "wb") as f:
                    f.write(base64.b64decode(data["data"]))
            except Exception as e:
                cleanup_temp(temp_dir)
                raise HTTPException(status_code=400, detail=f"Failed to download cloud master file from database: {str(e)}")
        elif master_url and master_url != 'cloud-db':
            master_path = os.path.join(temp_dir, "downloaded_master.xlsx")
            try:
                import requests
                r = requests.get(master_url, timeout=15)
                r.raise_for_status()
                with open(master_path, "wb") as f:
                    f.write(r.content)
            except Exception as e:
                cleanup_temp(temp_dir)
                raise HTTPException(status_code=400, detail=f"Failed to download cloud master file: {str(e)}")
        elif not master_path or not os.path.exists(master_path):
            cleanup_temp(temp_dir)
            raise HTTPException(status_code=400, detail=f"Master file path '{master_path}' is invalid or not provided. Please check Profile Settings.")
            
    out_dir = os.path.join(temp_dir, "output")
    os.makedirs(out_dir, exist_ok=True)
    
    try:
        processor = InvoiceProcessor(
            po_file=po_path,
            master_file=master_path,
            output_folder=out_dir
        )
        success, msg = await run_in_threadpool(processor.process)
        if not success:
            raise Exception(msg)
        
        return get_excel_response(out_dir, temp_dir, background_tasks)
        
    except Exception as e:
        cleanup_temp(temp_dir)
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/process-ecom-invoice")
async def process_ecom_invoice(
    background_tasks: BackgroundTasks,
    po_file: UploadFile = File(...),
    master_file: Optional[UploadFile] = File(None),
    profile_settings: str = Form("{}")
):
    temp_dir = tempfile.mkdtemp()
    
    po_path = os.path.join(temp_dir, po_file.filename)
    with open(po_path, "wb") as f:
        f.write(await po_file.read())
        
    profile = json.loads(profile_settings)
    if master_file:
        master_path = os.path.join(temp_dir, master_file.filename)
        with open(master_path, "wb") as f:
            f.write(await master_file.read())
    else:
        master_url = 'cloud-db' # Force cloud database
        master_path = profile.get("ecom_master_path", "").strip('\"\'')
        
        if master_url == 'cloud-db':
            rtdb_url = "https://automation-suit-cece7-default-rtdb.asia-southeast1.firebasedatabase.app/global_master_files/ecom_master_url.json"
            try:
                import requests
                import base64
                r = requests.get(rtdb_url, timeout=15)
                r.raise_for_status()
                data = r.json()
                if not data or not data.get("data"):
                    raise Exception("Data not found")
                master_path = os.path.join(temp_dir, "downloaded_master.xlsx")
                with open(master_path, "wb") as f:
                    f.write(base64.b64decode(data["data"]))
            except Exception as e:
                cleanup_temp(temp_dir)
                raise HTTPException(status_code=400, detail=f"Failed to download cloud master file from database: {str(e)}")
        elif master_url and master_url != 'cloud-db':
            master_path = os.path.join(temp_dir, "downloaded_master.xlsx")
            try:
                import requests
                r = requests.get(master_url, timeout=15)
                r.raise_for_status()
                with open(master_path, "wb") as f:
                    f.write(r.content)
            except Exception as e:
                cleanup_temp(temp_dir)
                raise HTTPException(status_code=400, detail=f"Failed to download cloud master file: {str(e)}")
        elif not master_path or not os.path.exists(master_path):
            cleanup_temp(temp_dir)
            raise HTTPException(status_code=400, detail=f"E-Com Master file path '{master_path}' is invalid or not provided. Please check Profile Settings.")
            
    out_dir = os.path.join(temp_dir, "output")
    os.makedirs(out_dir, exist_ok=True)
    
    try:
        processor = EcomInvoiceProcessor(
            po_file=po_path,
            master_file=master_path,
            output_folder=out_dir,
            dest_settings=profile
        )
        success, msg = await run_in_threadpool(processor.process)
        if not success:
            raise Exception(msg)
        
        return get_excel_response(out_dir, temp_dir, background_tasks)
        
    except Exception as e:
        cleanup_temp(temp_dir)
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/process-transfer-order")
async def process_transfer_order(
    background_tasks: BackgroundTasks,
    to_file: UploadFile = File(...),
    master_file: Optional[UploadFile] = File(None),
    profile_settings: str = Form("{}")
):
    temp_dir = tempfile.mkdtemp()
    
    to_path = os.path.join(temp_dir, to_file.filename)
    with open(to_path, "wb") as f:
        f.write(await to_file.read())
        
    profile = json.loads(profile_settings)
    if master_file:
        master_path = os.path.join(temp_dir, master_file.filename)
        with open(master_path, "wb") as f:
            f.write(await master_file.read())
    else:
        master_url = 'cloud-db' # Force cloud database
        master_path = profile.get("dest_master_path", "").strip('\"\'')
        
        if master_url == 'cloud-db':
            rtdb_url = "https://automation-suit-cece7-default-rtdb.asia-southeast1.firebasedatabase.app/global_master_files/dest_master_url.json"
            try:
                import requests
                import base64
                r = requests.get(rtdb_url, timeout=15)
                r.raise_for_status()
                data = r.json()
                if not data or not data.get("data"):
                    raise Exception("Data not found")
                master_path = os.path.join(temp_dir, "downloaded_master.xlsx")
                with open(master_path, "wb") as f:
                    f.write(base64.b64decode(data["data"]))
            except Exception as e:
                cleanup_temp(temp_dir)
                raise HTTPException(status_code=400, detail=f"Failed to download cloud master file from database: {str(e)}")
        elif master_url and master_url != 'cloud-db':
            master_path = os.path.join(temp_dir, "downloaded_master.xlsx")
            try:
                import requests
                r = requests.get(master_url, timeout=15)
                r.raise_for_status()
                with open(master_path, "wb") as f:
                    f.write(r.content)
            except Exception as e:
                cleanup_temp(temp_dir)
                raise HTTPException(status_code=400, detail=f"Failed to download cloud master file: {str(e)}")
        elif not master_path or not os.path.exists(master_path):
            cleanup_temp(temp_dir)
            raise HTTPException(status_code=400, detail=f"Destruction Master file path '{master_path}' is invalid or not provided. Please check Profile Settings.")
            
    out_dir = os.path.join(temp_dir, "output")
    os.makedirs(out_dir, exist_ok=True)
    
    try:
        processor = TransferOrderProcessor(
            to_file=to_path,
            master_file=master_path,
            output_folder=out_dir,
            profile_settings=profile
        )
        success, msg = await run_in_threadpool(processor.process)
        if not success:
            raise Exception(msg)
        
        return get_excel_response(out_dir, temp_dir, background_tasks)
        
    except Exception as e:
        cleanup_temp(temp_dir)
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/process-request-form")
async def process_request_form(
    background_tasks: BackgroundTasks,
    form_type: str = Form(...),
    data_json: str = Form(...),
    profile_settings: str = Form("{}")
):
    temp_dir = tempfile.mkdtemp()
    out_dir = os.path.join(temp_dir, "output")
    os.makedirs(out_dir, exist_ok=True)
    
    try:
        profile = json.loads(profile_settings)
        data = json.loads(data_json)
        processor = RequestFormProcessor(
            form_type=form_type,
            data=data,
            output_folder=out_dir,
            dest_settings=profile
        )
        success, result = await run_in_threadpool(processor.process)
        if not success:
            raise Exception(result)
            
        return get_excel_response(out_dir, temp_dir, background_tasks)
        
    except Exception as e:
        cleanup_temp(temp_dir)
        raise HTTPException(status_code=400, detail=str(e))
