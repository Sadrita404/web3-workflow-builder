"use client";

import React, { useState, useEffect } from 'react';
import { Info, AlertCircle } from 'lucide-react';
import { ConstructorParam, validateConstructorArg, getDefaultValue } from '@/lib/constructorParser';

interface ConstructorArgsInputProps {
  params: ConstructorParam[];
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

export default function ConstructorArgsInput({
  params,
  values,
  onChange,
  disabled = false,
}: ConstructorArgsInputProps) {
  const [localValues, setLocalValues] = useState<string[]>(() => {
    // Initialize with provided values or defaults
    if (values.length > 0) {
      return values;
    }
    if (params.length > 0) {
      return params.map((param) => getDefaultValue(param.type, param.name));
    }
    return [];
  });
  const [errors, setErrors] = useState<{ [key: number]: string }>({});
  const [initialized, setInitialized] = useState(false);

  // Initialize default values once
  useEffect(() => {
    if (!initialized && params.length > 0 && values.length === 0) {
      const defaultValues = params.map((param) => getDefaultValue(param.type, param.name));
      setLocalValues(defaultValues);
      onChange(defaultValues);
      setInitialized(true);
    }
  }, [params, values, initialized, onChange]);

  // Update local values when params change (new ABI loaded)
  useEffect(() => {
    if (params.length > 0 && localValues.length !== params.length) {
      const newValues = params.map((param, i) =>
        localValues[i] || getDefaultValue(param.type, param.name)
      );
      setLocalValues(newValues);
    }
  }, [params, localValues]);

  const handleChange = (index: number, value: string) => {
    const newValues = [...localValues];
    newValues[index] = value;
    setLocalValues(newValues);

    // Validate
    const validation = validateConstructorArg(value, params[index].type);
    const newErrors = { ...errors };
    if (!validation.valid) {
      newErrors[index] = validation.error || 'Invalid value';
    } else {
      delete newErrors[index];
    }
    setErrors(newErrors);

    // Update parent
    onChange(newValues);
  };

  if (params.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
        <Info className="w-4 h-4" />
        <span>No constructor parameters required</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <span>Constructor Parameters</span>
        <span className="text-xs text-gray-500">({params.length})</span>
      </div>

      {params.map((param, index) => (
        <div key={index} className="space-y-1">
          <label className="block">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                {param.name}
                <span className="ml-2 text-xs text-gray-500 font-mono">{param.type}</span>
              </span>
            </div>

            {param.description && (
              <p className="text-xs text-gray-500 mb-1">{param.description}</p>
            )}

            {param.type === 'bool' ? (
              <select
                value={localValues[index] || 'false'}
                onChange={(e) => handleChange(index, e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : param.type.endsWith('[]') ? (
              <textarea
                value={localValues[index] || '[]'}
                onChange={(e) => handleChange(index, e.target.value)}
                disabled={disabled}
                placeholder={param.placeholder || '["item1", "item2"]'}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            ) : (
              <input
                type="text"
                value={localValues[index] || ''}
                onChange={(e) => handleChange(index, e.target.value)}
                disabled={disabled}
                placeholder={param.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            )}
          </label>

          {errors[index] && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3 h-3" />
              <span>{errors[index]}</span>
            </div>
          )}
        </div>
      ))}

      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> These values will be used when deploying the contract.
          Make sure they match your contract's constructor requirements.
        </p>
      </div>
    </div>
  );
}
