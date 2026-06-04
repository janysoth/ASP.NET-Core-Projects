import React from 'react';
import PasswordStrength from '../common/PasswordStrength';
import InputField from '../input/InputField';

const ChangePasswordCard = ({
  fields,
  formData,
  handleChange,
  onSubmit,
  loading,
  hasErrors,
}) => {
  const renderField = (field) => (
    <div key={field.name}>
      <InputField
        {...field}
        value={formData[field.name]}
        onChange={handleChange(field.name)}
      />

      {field.name === 'newPassword' && (
        <PasswordStrength password={formData.newPassword} />
      )}
    </div>
  );

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-4">
        {fields.map(renderField)}

        <button
          type="submit"
          disabled={loading || hasErrors}
          className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordCard;