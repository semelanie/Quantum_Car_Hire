import { useRef, useState } from 'react';
import { useVehicles } from '../context/VehiclesContext';
import { resizeImageFile } from './imageUtils';
import type { Vehicle } from '../types/vehicle';

interface VehicleEditorProps {
  vehicle: Vehicle;
}

export default function VehicleEditor({ vehicle }: VehicleEditorProps) {
  const { updateVehicle, resetVehicle, isVehicleModified } = useVehicles();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const modified = isVehicleModified(vehicle.key);

  function patch(fields: Partial<Vehicle>) {
    updateVehicle(vehicle.key, fields);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file.');
      return;
    }
    try {
      const dataUrl = await resizeImageFile(file);
      patch({ image: dataUrl });
      setImageError(null);
    } catch {
      setImageError("Couldn't read that image — try a different file.");
    }
  }

  function updateSpecItem(index: number, value: string) {
    const next = [...vehicle.specItems];
    next[index] = value;
    patch({ specItems: next });
  }
  function addSpecItem() {
    patch({ specItems: [...vehicle.specItems, ''] });
  }
  function removeSpecItem(index: number) {
    patch({ specItems: vehicle.specItems.filter((_, i) => i !== index) });
  }

  function updateFeature(index: number, field: 'label' | 'description', value: string) {
    const next = vehicle.features.map((f, i) => (i === index ? { ...f, [field]: value } : f));
    patch({ features: next });
  }
  function addFeature() {
    patch({ features: [...vehicle.features, { label: '', description: '' }] });
  }
  function removeFeature(index: number) {
    patch({ features: vehicle.features.filter((_, i) => i !== index) });
  }

  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h2>
          {vehicle.name || <span className="admin-placeholder">Untitled vehicle</span>}
          {modified && <span className="admin-badge">Edited</span>}
        </h2>
        <button
          type="button"
          className="admin-link-btn"
          onClick={() => {
            if (window.confirm(`Reset ${vehicle.name || 'this vehicle'} back to its original details?`)) {
              resetVehicle(vehicle.key);
            }
          }}
          disabled={!modified}
        >
          Reset to default
        </button>
      </div>

      <div className="admin-card-body">
        <div className="admin-photo-col">
          <img className="admin-photo-preview" src={vehicle.image} alt={vehicle.name} />
          <button type="button" className="btn btn-ghost-dark" onClick={() => fileInputRef.current?.click()}>
            Change photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="admin-file-input"
            onChange={handlePhotoChange}
          />
          {imageError && <p className="admin-field-error">{imageError}</p>}
          <a className="admin-download-link" href={vehicle.image} download={`${vehicle.key || 'vehicle'}.jpg`}>
            Download current photo
          </a>
        </div>

        <div className="admin-fields-col">
          <div className="admin-field-row">
            <label>
              Name
              <input type="text" value={vehicle.name} onChange={(e) => patch({ name: e.target.value })} />
            </label>
          </div>

          <div className="admin-field-grid-4">
            <label>
              Daily rate
              <input type="text" value={vehicle.dailyPrice} onChange={(e) => patch({ dailyPrice: e.target.value })} />
            </label>
            <label>
              Weekly rate
              <input type="text" value={vehicle.weeklyPrice} onChange={(e) => patch({ weeklyPrice: e.target.value })} />
            </label>
            <label>
              Monthly rate
              <input type="text" value={vehicle.monthlyPrice} onChange={(e) => patch({ monthlyPrice: e.target.value })} />
            </label>
            <label>
              Deposit
              <input type="text" value={vehicle.deposit} onChange={(e) => patch({ deposit: e.target.value })} />
            </label>
          </div>

          <div className="admin-field-row">
            <label>
              Detail line (shown in the &ldquo;Book this car&rdquo; popup)
              <input type="text" value={vehicle.specs} onChange={(e) => patch({ specs: e.target.value })} />
            </label>
          </div>

          <div className="admin-field-row">
            <label>
              Rates-list subtitle
              <input type="text" value={vehicle.rateSubtitle} onChange={(e) => patch({ rateSubtitle: e.target.value })} />
            </label>
          </div>

          <div className="admin-list-field">
            <span className="admin-list-label">Spec badges (shown on the fleet card)</span>
            {vehicle.specItems.map((item, i) => (
              <div className="admin-list-row" key={i}>
                <input type="text" value={item} onChange={(e) => updateSpecItem(i, e.target.value)} />
                <button type="button" className="admin-remove-btn" aria-label="Remove" onClick={() => removeSpecItem(i)}>
                  &times;
                </button>
              </div>
            ))}
            <button type="button" className="admin-add-btn" onClick={addSpecItem}>
              + Add spec
            </button>
          </div>

          <div className="admin-list-field">
            <span className="admin-list-label">Features (shown in the &ldquo;Book this car&rdquo; popup)</span>
            {vehicle.features.map((f, i) => (
              <div className="admin-feature-row" key={i}>
                <input type="text" placeholder="Label" value={f.label} onChange={(e) => updateFeature(i, 'label', e.target.value)} />
                <input
                  type="text"
                  placeholder="Description"
                  value={f.description}
                  onChange={(e) => updateFeature(i, 'description', e.target.value)}
                />
                <button type="button" className="admin-remove-btn" aria-label="Remove" onClick={() => removeFeature(i)}>
                  &times;
                </button>
              </div>
            ))}
            <button type="button" className="admin-add-btn" onClick={addFeature}>
              + Add feature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
