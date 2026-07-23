import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const PartsRequestForm = ({ isOpen, onClose, ticket, onSubmit }) => {
  const [partName, setPartName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [barcode, setBarcode] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!partName?.trim()) {
      alert('Please enter part name');
      return;
    }

    onSubmit?.({
      ticketId: ticket?.id,
      partName,
      quantity,
      barcode,
      notes
    });

    // Reset form
    setPartName('');
    setQuantity(1);
    setBarcode('');
    setNotes('');
  };

  const handleBarcodeScanning = () => {
    // Simulate barcode scan
    alert('Barcode scanning feature - would use device camera');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
      <div className="bg-card border border-border rounded-t-2xl md:rounded-lg shadow-lg w-full md:max-w-lg mx-0 md:mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="Package" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Parts Request</h2>
              <p className="text-xs text-muted-foreground">Request spare parts for this ticket</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            iconName="X"
            onClick={onClose}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Ticket Reference */}
          <div className="bg-muted/30 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Ticket Reference</p>
            <p className="text-sm font-mono text-foreground">{ticket?.referenceNumber}</p>
          </div>

          {/* Part Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Part Name *
            </label>
            <Input
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="e.g., Compressor Motor, Door Seal"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Quantity *
            </label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              min={1}
            />
          </div>

          {/* Barcode Scan */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Barcode (Optional)
            </label>
            <div className="flex gap-2">
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or enter barcode"
                className="flex-1"
              />
              <Button
                variant="outline"
                iconName="Scan"
                onClick={handleBarcodeScanning}
              >
                Scan
              </Button>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Urgency, specifications, or alternative parts..."
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
              rows={3}
            />
          </div>

          {/* Supplier Contact */}
          <div className="bg-info/10 border border-info/20 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="Phone" size={16} className="text-info mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-info mb-1">Supplier Contact</p>
                <p className="text-xs text-info/80">PNG Medical Supplies: +675 325 1234</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-4 border-t border-border">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            fullWidth
            iconName="Send"
            iconPosition="left"
            onClick={handleSubmit}
            disabled={!partName?.trim()}
          >
            Submit Request
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PartsRequestForm;