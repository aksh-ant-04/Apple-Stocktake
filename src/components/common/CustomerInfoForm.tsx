import React from 'react';
import { motion } from 'framer-motion';
import { Upload, X, User, Save, Trash2, RotateCcw } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { CustomerInfo } from '../../types';

interface CustomerInfoFormProps {
  readOnly?: boolean;
}

const CustomerInfoForm: React.FC<CustomerInfoFormProps> = ({ readOnly = false }) => {
  const { state, savedEvents, updateCustomerInfo, saveEvent, deleteEvent, clearCustomerInfo } = useAppContext();
  const { customerInfo } = state;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateCustomerInfo({ [name]: value } as Partial<CustomerInfo>);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value === '' ? 0 : parseInt(value, 10) || 0;
    updateCustomerInfo({ [name]: numericValue } as Partial<CustomerInfo>);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        updateCustomerInfo({ logo: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    updateCustomerInfo({ logo: '' });
  };

  const handleSaveEvent = () => {
    if (!customerInfo.eventId.trim()) {
      alert('Please enter an Event ID before saving.');
      return;
    }

    if (!customerInfo.customerName.trim()) {
      alert('Please enter a Customer Name before saving.');
      return;
    }

    const success = saveEvent(customerInfo.eventId);
    if (success) {
      alert(`Event "${customerInfo.eventId}" has been saved successfully!`);
    }
  };

  const handleDeleteEvent = () => {
    if (!customerInfo.eventId) {
      alert('No event selected to delete.');
      return;
    }

    if (confirm(`Are you sure you want to delete the event "${customerInfo.eventId}"? This action cannot be undone.`)) {
      deleteEvent(customerInfo.eventId);
      alert(`Event "${customerInfo.eventId}" has been deleted.`);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all customer information? This will not delete saved events.')) {
      clearCustomerInfo();
    }
  };

  const isEventSaved = savedEvents.some(event => event.eventId === customerInfo.eventId);
  const canSave = customerInfo.eventId.trim() && customerInfo.customerName.trim();

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {!readOnly && (
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="w-5 h-5 text-primary-600 mr-2" />
              <h2 className="text-xl font-semibold">Customer Information</h2>
              {savedEvents.length > 0 && (
                <span className="ml-3 px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded-full">
                  {savedEvents.length} saved event{savedEvents.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleClearAll}
                className="flex items-center px-3 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-md hover:bg-orange-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Clear All
              </button>
              {customerInfo.eventId && isEventSaved && (
                <button
                  onClick={handleDeleteEvent}
                  className="flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Event
                </button>
              )}
              <button
                onClick={handleSaveEvent}
                disabled={!canSave}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  canSave
                    ? 'text-green-700 bg-green-100 hover:bg-green-200'
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4 mr-1" />
                Save Event
              </button>
            </div>
          </div>
          <div className="mt-3 text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
            <strong>Instructions:</strong> Enter Event ID and customer information below. Click "Save Event" to add this event to the dropdown for future use. Events are automatically saved to your browser and will persist across sessions.
          </div>
        </div>
      )}
      
      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50 w-1/4">
              Event ID {!readOnly && <span className="text-red-500">*</span>}
            </td>
            <td className="border border-gray-300 px-4 py-2 w-1/4">
              {readOnly ? (
                customerInfo.eventId
              ) : (
                <input
                  type="text"
                  name="eventId"
                  value={customerInfo.eventId}
                  onChange={handleChange}
                  placeholder="Enter Event ID"
                  className="w-full px-2 py-1 focus:outline-none"
                />
              )}
            </td>
            <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50 w-1/4">Date of Stock Take</td>
            <td className="border border-gray-300 px-4 py-2 w-1/4">
              {readOnly ? (
                customerInfo.dateOfStockTake
              ) : (
                <input
                  type="date"
                  name="dateOfStockTake"
                  value={customerInfo.dateOfStockTake}
                  onChange={handleChange}
                  className="w-full px-2 py-1 focus:outline-none"
                />
              )}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50 w-1/4">
              Customer Name {!readOnly && <span className="text-red-500">*</span>}
            </td>
            <td className="border border-gray-300 px-4 py-2 w-1/4">
              {readOnly ? (
                customerInfo.customerName
              ) : (
                <input
                  type="text"
                  name="customerName"
                  value={customerInfo.customerName}
                  onChange={handleChange}
                  placeholder="Enter Customer Name"
                  className="w-full px-2 py-1 focus:outline-none"
                />
              )}
            </td>
            <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50 w-1/4">Time of Stock Take</td>
            <td className="border border-gray-300 px-4 py-2 w-1/4">
              {readOnly ? (
                customerInfo.timeOfStockTake
              ) : (
                <input
                  type="time"
                  name="timeOfStockTake"
                  value={customerInfo.timeOfStockTake}
                  onChange={handleChange}
                  className="w-full px-2 py-1 focus:outline-none"
                />
              )}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50 w-1/4">Company Logo</td>
            <td className="border border-gray-300 px-4 py-2" colSpan={3}>
              {readOnly ? (
                customerInfo.logo && (
                  <img 
                    src={customerInfo.logo} 
                    alt="Company Logo" 
                    className="h-16 object-contain"
                  />
                )
              ) : (
                <div className="flex items-center space-x-4">
                  {customerInfo.logo ? (
                    <div className="flex items-center space-x-4">
                      <img 
                        src={customerInfo.logo} 
                        alt="Company Logo" 
                        className="h-16 object-contain"
                      />
                      <button
                        onClick={handleRemoveLogo}
                        className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center space-x-2 cursor-pointer text-primary-600 hover:text-primary-700">
                      <Upload className="w-5 h-5" />
                      <span>Upload Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}
            </td>
          </tr>
          <TableRow 
            label="Outlet Address" 
            name="outletAddress"
            value={customerInfo.outletAddress}
            onChange={handleChange}
            readOnly={readOnly}
          />
          <tr>
            <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50 w-1/4">ACREBIS Supervisor</td>
            <td className="border border-gray-300 px-4 py-2 w-1/4">
              {readOnly ? (
                customerInfo.acrebisSupervisor
              ) : (
                <input
                  type="text"
                  name="acrebisSupervisor"
                  value={customerInfo.acrebisSupervisor}
                  onChange={handleChange}
                  className="w-full px-2 py-1 focus:outline-none"
                />
              )}
            </td>
            <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50 w-1/4">Customer Supervisor</td>
            <td className="border border-gray-300 px-4 py-2 w-1/4">
              {readOnly ? (
                customerInfo.customerSupervisor
              ) : (
                <input
                  type="text"
                  name="customerSupervisor"
                  value={customerInfo.customerSupervisor}
                  onChange={handleChange}
                  className="w-full px-2 py-1 focus:outline-none"
                />
              )}
            </td>
          </tr>
          <NumberTableRow 
            label="Total Stocktake Location" 
            name="totalStocktakeLocation"
            value={customerInfo.totalStocktakeLocation}
            onChange={handleNumberChange}
            readOnly={readOnly}
          />
        </tbody>
      </table>
    </motion.div>
  );
};

interface TableRowProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
}

const TableRow: React.FC<TableRowProps> = ({ label, name, value, onChange, readOnly = false }) => {
  return (
    <tr>
      <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50 w-1/4">{label}</td>
      <td className="border border-gray-300 px-4 py-2" colSpan={3}>
        {readOnly ? (
          value
        ) : (
          <input
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            className="w-full px-2 py-1 focus:outline-none"
          />
        )}
      </td>
    </tr>
  );
};

interface NumberTableRowProps {
  label: string;
  name: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
}

const NumberTableRow: React.FC<NumberTableRowProps> = ({ label, name, value, onChange, readOnly = false }) => {
  return (
    <tr>
      <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50 w-1/4">{label}</td>
      <td className="border border-gray-300 px-4 py-2" colSpan={3}>
        {readOnly ? (
          value.toString()
        ) : (
          <input
            type="number"
            name={name}
            value={value}
            onChange={onChange}
            min="0"
            className="w-full px-2 py-1 focus:outline-none"
          />
        )}
      </td>
    </tr>
  );
};

export default CustomerInfoForm;