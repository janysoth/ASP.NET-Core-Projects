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
        <PasswordStrength
          password={formData.newPassword}
        />
      )}
    </div>
  );

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4"
    >
      {fields.map(renderField)}

      <button
        type="submit"
        disabled={loading || hasErrors}
        className="
          w-full
          rounded-lg
          bg-[var(--app-primary)]
          py-3
          font-medium
          text-white
          transition-colors
          hover:bg-[var(--app-primary-hover)]
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {loading
          ? 'Updating...'
          : 'Change Password'}
      </button>
    </form>
  );
};

export default ChangePasswordCard;