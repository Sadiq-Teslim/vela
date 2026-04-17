-- Create a SECURITY DEFINER function so the public payment page can mark
-- an invoice as PAID after on-chain verification, without needing the
-- freelancer's session. RLS on invoices otherwise blocks unauthenticated updates.
--
-- The function only accepts status transitions to PAID — it cannot be abused
-- to change other fields or set arbitrary statuses.

CREATE OR REPLACE FUNCTION mark_invoice_paid(
  p_invoice_id UUID,
  p_tx_hash TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_status invoice_status;
BEGIN
  -- Only update if the invoice exists and isn't already paid
  SELECT status INTO v_current_status FROM invoices WHERE id = p_invoice_id;

  IF v_current_status IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_current_status = 'PAID' THEN
    RETURN TRUE;
  END IF;

  UPDATE invoices
  SET status = 'PAID',
      payment_tx_hash = p_tx_hash,
      paid_at = NOW()
  WHERE id = p_invoice_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow anyone (authenticated or anonymous) to call this function
GRANT EXECUTE ON FUNCTION mark_invoice_paid(UUID, TEXT) TO anon, authenticated;
