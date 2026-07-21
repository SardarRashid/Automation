import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Save, ArrowLeft, Search, Plus, X, CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";
import type { StoreRoom, StockLot, StockCountSessionItem, PalletBatch } from "../../types";
import { getActiveLotsInRoom } from "../../services/movementService";
import { updateStockLotPalletSize, createStockLot, updateStockLotQty } from "../../services/productService";
import { submitStockCountSession } from "../../services/stockCountService";
import { RoomSelectorCards } from "./RoomSelectorCards";

interface ActiveLot extends StockLot {
  expectedQty: number;
  openingQty: number;
  todayQty: number;
  isManualEntry?: boolean;
}

interface ItemEntryState {
  numberQty: number;
  batches: PalletBatch[];
  destructionQty: number;
  auctionQty: number;
  reason: string;
}

function emptyBatch(defaultUnitsPerPallet?: number): PalletBatch {
  return { pallets: 0, unitsPerPallet: defaultUnitsPerPallet || 0 };
}

function palletTotal(batches: PalletBatch[]): number {
  return batches.reduce((sum, b) => sum + (Number(b.pallets) || 0) * (Number(b.unitsPerPallet) || 0), 0);
}

function computeTotal(entry: ItemEntryState): number {
  const counted = (Number(entry.numberQty) || 0) + palletTotal(entry.batches);
  return counted - (Number(entry.destructionQty) || 0) - (Number(entry.auctionQty) || 0);
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function emptyEntry(lastPalletSize?: number): ItemEntryState {
  return { numberQty: 0, batches: [emptyBatch(lastPalletSize)], destructionQty: 0, auctionQty: 0, reason: '' };
}

export function InventoryCountWorksheet({ storeRooms, currentUser, onBack, onSuccess }: any) {
  const [selectedRoomId, setSelectedRoomId] = useState(storeRooms[0]?.id || "");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [lots, setLots] = useState<ActiveLot[]>([]);
  const [entries, setEntries] = useState<Record<string, ItemEntryState>>({});
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [directUpdate, setDirectUpdate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ categoryId: '', variety: '', size: '', originCountry: '', grade: '' });

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!selectedRoomId) return;
    async function load() {
      setLoading(true);
      try {
        const roomLots = await getActiveLotsInRoom(selectedRoomId);
        setLots(roomLots as ActiveLot[]);

        const initialEntries: Record<string, ItemEntryState> = {};
        roomLots.forEach((lot: ActiveLot) => {
          initialEntries[lot.id] = emptyEntry(lot.lastPalletSize);
        });
        setEntries(initialEntries);
        setSavedIds({});
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, [selectedRoomId]);

  const filteredLots = useMemo(() => {
    if (!searchTerm) return lots;
    const term = searchTerm.toLowerCase();
    return lots.filter(l =>
      l.categoryId.toLowerCase().includes(term) ||
      l.variety.toLowerCase().includes(term) ||
      l.size.toLowerCase().includes(term)
    );
  }, [lots, searchTerm]);

  const setEntry = (lotId: string, patch: Partial<ItemEntryState>) => {
    setEntries(prev => ({ ...prev, [lotId]: { ...prev[lotId], ...patch } }));
  };

  const updateBatch = (lotId: string, index: number, patch: Partial<PalletBatch>) => {
    setEntries(prev => {
      const current = prev[lotId];
      const batches = current.batches.map((b, i) => i === index ? { ...b, ...patch } : b);
      return { ...prev, [lotId]: { ...current, batches } };
    });
  };

  const addBatchRow = (lotId: string) => {
    setEntries(prev => {
      const current = prev[lotId];
      const lastUnits = current.batches[current.batches.length - 1]?.unitsPerPallet;
      return { ...prev, [lotId]: { ...current, batches: [...current.batches, emptyBatch(lastUnits)] } };
    });
  };

  const removeBatchRow = (lotId: string, index: number) => {
    setEntries(prev => {
      const current = prev[lotId];
      if (current.batches.length <= 1) return prev;
      return { ...prev, [lotId]: { ...current, batches: current.batches.filter((_, i) => i !== index) } };
    });
  };

  const saveItem = (lotId: string) => {
    setSavedIds(prev => ({ ...prev, [lotId]: true }));
  };

  const editItem = (lotId: string) => {
    setSavedIds(prev => {
      const next = { ...prev };
      delete next[lotId];
      return next;
    });
    cardRefs.current[lotId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const removeSavedItem = (lotId: string) => {
    if (!window.confirm("Remove this saved count? You can re-enter it before submitting.")) return;
    setSavedIds(prev => {
      const next = { ...prev };
      delete next[lotId];
      return next;
    });
    setEntry(lotId, emptyEntry(lots.find(l => l.id === lotId)?.lastPalletSize));
  };

  const handleAddManualItem = () => {
    if (!addForm.categoryId || !addForm.variety || !addForm.size) {
      alert("Category, variety, and size are required.");
      return;
    }
    const manualId = `manual-${Date.now()}`;
    const manualLot: ActiveLot = {
      id: manualId,
      categoryId: addForm.categoryId,
      variety: addForm.variety,
      size: addForm.size,
      originCountry: addForm.originCountry || undefined,
      grade: addForm.grade || undefined,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expectedQty: 0,
      openingQty: 0,
      todayQty: 0,
      isManualEntry: true
    };
    setLots(prev => [...prev, manualLot]);
    setEntries(prev => ({ ...prev, [manualId]: emptyEntry() }));
    setAddForm({ categoryId: '', variety: '', size: '', originCountry: '', grade: '' });
    setShowAddForm(false);
  };

  const savedList = useMemo(() => {
    return lots.filter(lot => savedIds[lot.id]);
  }, [lots, savedIds]);

  const handleSubmitAll = async () => {
    if (savedList.length === 0) {
      alert("No saved items to submit yet — save at least one item first.");
      return;
    }
    if (!window.confirm(`Submit ${savedList.length} saved item(s) for ${selectedDate}?`)) return;
    setLoading(true);

    try {
      const items: StockCountSessionItem[] = [];

      for (const lot of savedList) {
        const e = entries[lot.id];
        let stockLotId = lot.id;

        if (lot.isManualEntry) {
          const created = await createStockLot({
            categoryId: lot.categoryId,
            variety: lot.variety,
            size: lot.size,
            originCountry: lot.originCountry,
            grade: lot.grade,
            status: 'Received'
          });
          stockLotId = created.id;
        }

        const total = computeTotal(e);
        items.push({
          stockLotId,
          categoryId: lot.categoryId,
          variety: lot.variety,
          size: lot.size,
          expectedQty: lot.expectedQty || 0,
          numberQty: e.numberQty || 0,
          palletBreakdown: e.batches.filter(b => b.pallets > 0 && b.unitsPerPallet > 0),
          destructionQty: e.destructionQty || 0,
          auctionQty: e.auctionQty || 0,
          actualQty: total,
          difference: total - (lot.expectedQty || 0),
          reason: e.reason,
          isManualEntry: !!lot.isManualEntry
        });
      }

      await submitStockCountSession({
        date: selectedDate,
        storeRoomId: selectedRoomId,
        storekeeperId: currentUser?.id || "unknown",
        storekeeperName: currentUser?.name || "Unknown",
        status: directUpdate ? 'Auto-Approved' : 'Pending Verification',
        timestamp: new Date().toISOString(),
        items
      });

      for (const lot of savedList) {
        const e = entries[lot.id];
        const total = computeTotal(e);
        
        if (directUpdate && !lot.isManualEntry) {
          try {
            await updateStockLotQty(lot.id, total, total);
          } catch (err) {
            console.error("Failed to update stock lot quantity", err);
          }
        }
        const lastValidBatch = [...e.batches].reverse().find(b => b.unitsPerPallet > 0);
        if (lastValidBatch && !lot.isManualEntry) {
          updateStockLotPalletSize(lot.id, lastValidBatch.unitsPerPallet).catch(err =>
            console.error(`Non-blocking: failed to remember pallet size for lot ${lot.id}`, err)
          );
        }
      }

      onSuccess(`${savedList.length} item(s) submitted for review!`);
      setSavedIds({});
    } catch (e) {
      console.error(e);
      alert("Error submitting session");
    }
    setLoading(false);
  };

  const progressPercent = lots.length > 0 ? Math.round((savedList.length / lots.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <header className="p-4 border-b border-slate-800 bg-slate-950 flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded"><ArrowLeft className="w-5 h-5 text-white" /></button>
            <h2 className="text-white font-bold tracking-wide">Count Worksheet</h2>
          </div>
          <div className="text-right">
             <div className="text-emerald-400 font-bold text-sm">{savedList.length} / {lots.length}</div>
             <div className="text-slate-500 text-xs">Saved</div>
          </div>
        </div>

        {lots.length > 0 && (
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all duration-300" style={{width: `${progressPercent}%`}}></div>
          </div>
        )}
      </header>

      <div className="p-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1">
            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Count date</div>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 px-2 text-xs text-white"
            />
          </div>
        </div>

        <RoomSelectorCards
          rooms={storeRooms}
          selectedRoomId={selectedRoomId}
          onSelect={setSelectedRoomId}
          label="Target Room"
        />

        <div className="relative mt-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Jump to product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? <div className="text-center text-white p-4">Loading...</div> : filteredLots.length === 0 ? <div className="text-center text-slate-500 p-4">No matching lots found.</div> : filteredLots.map(lot => {
          const e = entries[lot.id];
          if (!e) return null;
          const isSaved = !!savedIds[lot.id];
          const total = computeTotal(e);
          const diff = total - (lot.expectedQty || 0);

          return (
            <div
              key={lot.id}
              ref={el => cardRefs.current[lot.id] = el}
              className={`bg-slate-900 border rounded-xl p-3 shadow-md ${isSaved ? 'border-emerald-600/60' : diff !== 0 ? 'border-orange-500/60' : 'border-slate-800'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-white font-bold flex items-center gap-1.5">
                    {lot.categoryId} <span className="text-slate-400 font-normal">›</span> {lot.variety}
                    {lot.isManualEntry && <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">Manual</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="bg-slate-800 text-[10px] text-slate-300 px-1.5 py-0.5 rounded font-mono">Size {lot.size}</span>
                    {lot.originCountry && <span className="bg-slate-800 text-[10px] text-slate-300 px-1.5 py-0.5 rounded">{lot.originCountry}</span>}
                    {lot.grade && <span className="bg-slate-800 text-[10px] text-slate-300 px-1.5 py-0.5 rounded">{lot.grade}</span>}
                  </div>
                </div>
                {isSaved ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600 shrink-0" strokeDasharray="3 3" />
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5 mb-3">
                <div className="bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center">
                  <div className="text-slate-500 text-[8px] uppercase font-mono">Before</div>
                  <div className="text-white font-mono font-bold text-sm">{lot.openingQty}</div>
                </div>
                <div className="bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center">
                  <div className="text-emerald-500 text-[8px] uppercase font-mono">Arrived</div>
                  <div className="text-white font-mono font-bold text-sm">{lot.todayQty >= 0 ? '+' : ''}{lot.todayQty}</div>
                </div>
                <div className="bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-center">
                  <div className="text-slate-500 text-[8px] uppercase font-mono">Expected</div>
                  <div className="text-yellow-400 font-mono font-bold text-sm">{lot.expectedQty}</div>
                </div>
              </div>

              <fieldset disabled={isSaved} className={isSaved ? 'opacity-60' : ''}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase w-16 shrink-0">Number</span>
                  <input
                    type="number"
                    min={0}
                    value={e.numberQty === 0 ? '' : e.numberQty}
                    placeholder="0"
                    onChange={ev => setEntry(lot.id, { numberQty: parseInt(ev.target.value) || 0 })}
                    className="w-24 bg-slate-950 border border-slate-700 text-white p-1.5 rounded-lg text-center font-bold text-sm"
                  />
                  <span className="text-[10px] text-slate-500">units entered directly</span>
                </div>

                <div className="mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Pallets</span>
                  <div className="space-y-1.5 mt-1">
                    {e.batches.map((batch, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="number" min={0}
                          value={batch.pallets === 0 ? '' : batch.pallets}
                          placeholder="0"
                          onChange={ev => updateBatch(lot.id, idx, { pallets: parseInt(ev.target.value) || 0 })}
                          className="w-14 bg-slate-950 border border-slate-700 text-white p-1.5 rounded-lg text-center font-bold text-sm"
                        />
                        <span className="text-[9px] text-slate-500 shrink-0">× units</span>
                        <input
                          type="number" min={0}
                          value={batch.unitsPerPallet === 0 ? '' : batch.unitsPerPallet}
                          placeholder="units"
                          onChange={ev => updateBatch(lot.id, idx, { unitsPerPallet: parseInt(ev.target.value) || 0 })}
                          className="w-16 bg-slate-950 border border-slate-700 text-white p-1.5 rounded-lg text-center font-bold text-sm"
                        />
                        <span className="text-sm font-bold text-white ml-auto">{(batch.pallets || 0) * (batch.unitsPerPallet || 0)}</span>
                        {e.batches.length > 1 && (
                          <button type="button" onClick={() => removeBatchRow(lot.id, idx)} className="text-slate-500 hover:text-red-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => addBatchRow(lot.id)} className="flex items-center gap-1 text-indigo-400 text-xs font-bold py-0.5">
                      <Plus className="w-3.5 h-3.5" /> Add another pallet size
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold text-red-400 uppercase">Destruction</span>
                    <input
                      type="number" min={0}
                      value={e.destructionQty === 0 ? '' : e.destructionQty}
                      placeholder="0"
                      onChange={ev => setEntry(lot.id, { destructionQty: parseInt(ev.target.value) || 0 })}
                      className="w-full mt-1 bg-slate-950 border border-red-900/50 text-white p-1.5 rounded-lg text-center font-bold text-sm"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-red-400 uppercase">Auction</span>
                    <input
                      type="number" min={0}
                      value={e.auctionQty === 0 ? '' : e.auctionQty}
                      placeholder="0"
                      onChange={ev => setEntry(lot.id, { auctionQty: parseInt(ev.target.value) || 0 })}
                      className="w-full mt-1 bg-slate-950 border border-red-900/50 text-white p-1.5 rounded-lg text-center font-bold text-sm"
                    />
                  </div>
                </div>
              </fieldset>

              <div className="bg-slate-950 rounded-lg p-2 text-[11px] space-y-1 mb-2">
                <div className="flex justify-between text-slate-400"><span>Number + pallets</span><span>{(e.numberQty || 0) + palletTotal(e.batches)}</span></div>
                {e.destructionQty > 0 && <div className="flex justify-between text-red-400"><span>Destruction</span><span>−{e.destructionQty}</span></div>}
                {e.auctionQty > 0 && <div className="flex justify-between text-red-400"><span>Auction</span><span>−{e.auctionQty}</span></div>}
                <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
                  <span>Total</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{total}</span>
                    {diff !== 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${diff > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {diff !== 0 && !isSaved && (
                <div className="mb-2">
                  <input
                    type="text"
                    placeholder="Reason for difference..."
                    value={e.reason || ''}
                    onChange={ev => setEntry(lot.id, { reason: ev.target.value })}
                    className="w-full bg-slate-950 border border-orange-900/50 text-orange-200 text-sm p-2 rounded-lg placeholder-orange-900/40"
                  />
                </div>
              )}

              {isSaved ? (
                <button
                  onClick={() => editItem(lot.id)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 rounded-lg flex justify-center items-center gap-1.5 text-sm"
                >
                  <Pencil className="w-3.5 h-3.5" /> Saved — tap to edit
                </button>
              ) : (
                <button
                  onClick={() => saveItem(lot.id)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg flex justify-center items-center gap-1.5 text-sm"
                >
                  <Save className="w-3.5 h-3.5" /> Save this item
                </button>
              )}
            </div>
          )
        })}

        {showAddForm ? (
          <div className="bg-slate-900 border border-indigo-600/60 rounded-xl p-3 space-y-2">
            <div className="text-white font-bold text-sm mb-1">Add item not listed</div>
            <input placeholder="Category (e.g. Apple)" value={addForm.categoryId} onChange={e => setAddForm(f => ({...f, categoryId: e.target.value}))} className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-sm" />
            <input placeholder="Variety (e.g. Fuji)" value={addForm.variety} onChange={e => setAddForm(f => ({...f, variety: e.target.value}))} className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Size" value={addForm.size} onChange={e => setAddForm(f => ({...f, size: e.target.value}))} className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-sm" />
              <input placeholder="Origin (optional)" value={addForm.originCountry} onChange={e => setAddForm(f => ({...f, originCountry: e.target.value}))} className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-sm" />
            </div>
            <input placeholder="Grade (optional)" value={addForm.grade} onChange={e => setAddForm(f => ({...f, grade: e.target.value}))} className="w-full bg-slate-950 border border-slate-700 text-white p-2 rounded-lg text-sm" />
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAddForm(false)} className="flex-1 bg-slate-800 text-slate-300 font-bold py-2 rounded-lg text-sm">Cancel</button>
              <button onClick={handleAddManualItem} className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-lg text-sm">Add to list</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-1.5 text-indigo-400 font-bold text-sm py-3 border border-dashed border-indigo-600/40 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add item not listed
          </button>
        )}

        {savedList.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Saved this session ({savedList.length})</div>
            <div className="space-y-1.5">
              {savedList.map(lot => {
                const e = entries[lot.id];
                const total = computeTotal(e);
                return (
                  <div key={lot.id} className="flex items-center justify-between bg-slate-950 rounded-lg px-2.5 py-2">
                    <span className="text-xs text-slate-200">{lot.categoryId} › {lot.variety}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{total}</span>
                      <button onClick={() => editItem(lot.id)} className="text-slate-500 hover:text-indigo-400"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => removeSavedItem(lot.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
        <button
          onClick={handleSubmitAll}
          disabled={loading || savedList.length === 0}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 transition-colors shadow-lg"
        >
          <Save className="w-5 h-5" /> Submit all saved ({savedList.length})
        </button>
      </div>
    </div>
  );
}
