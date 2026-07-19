import re
with open('frontend/src/inventory/types.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '''export type MovementType = 
  | 'RECEIPT'
  | 'SALE'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT'
  | 'SPOILAGE';''',
    '''export type MovementType = 
  | 'RECEIPT'
  | 'SALE'
  | 'DISPATCH'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT'
  | 'COUNT_ADJUSTMENT'
  | 'SPOILAGE';'''
)

content = content.replace(
    '''  status: 'Pending' | 'Received' | 'Cancelled';''',
    '''  status: 'Draft' | 'Pending' | 'Received' | 'Verified' | 'Closed' | 'Cancelled';'''
)

with open('frontend/src/inventory/types.ts', 'w', encoding='utf-8') as f:
    f.write(content)
