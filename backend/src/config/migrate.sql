-- ProcureEase migration: add item_name + unit to pr_items and po_items
ALTER TABLE pr_items
  ADD COLUMN IF NOT EXISTS item_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS unit      VARCHAR(50) DEFAULT 'pcs';

ALTER TABLE po_items
  ADD COLUMN IF NOT EXISTS item_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS unit      VARCHAR(50) DEFAULT 'pcs';
