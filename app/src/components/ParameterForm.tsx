'use client';

import React, { useState } from 'react';
import { Endpoint, Parameter, SchemaField } from '@/lib/types';
import { IconLink, IconSearch, IconClipboard, IconDocument } from '@/components/Icons';

interface Props {
    endpoint: Endpoint;
    values: Record<string, string>;
    onChange: (values: Record<string, string>) => void;
    missingFields?: string[];
}

export default function ParameterForm({ endpoint, values, onChange, missingFields = [] }: Props) {
    const [expandedBody, setExpandedBody] = useState(true);

    const handleChange = (name: string, value: string) => {
        onChange({ ...values, [name]: value });
    };

    const pathParams = endpoint.parameters.filter(p => p.in === 'path');
    const queryParams = endpoint.parameters.filter(p => p.in === 'query');
    const headerParams = endpoint.parameters.filter(p => p.in === 'header');

    return (
        <div className="parameter-form">
            {pathParams.length > 0 && (
                <div className="param-section">
                    <h4 className="param-section-title">
                        <IconLink size={13} /> Path Parameters
                    </h4>
                    {pathParams.map(p => renderParamInput(p, values, handleChange, missingFields))}
                </div>
            )}

            {queryParams.length > 0 && (
                <div className="param-section">
                    <h4 className="param-section-title">
                        <IconSearch size={13} /> Query Parameters
                    </h4>
                    {queryParams.map(p => renderParamInput(p, values, handleChange, missingFields))}
                </div>
            )}

            {headerParams.length > 0 && (
                <div className="param-section">
                    <h4 className="param-section-title">
                        <IconClipboard size={13} /> Headers
                    </h4>
                    {headerParams.map(p => renderParamInput(p, values, handleChange, missingFields))}
                </div>
            )}

            {endpoint.requestBody && (
                <div className="param-section">
                    <h4
                        className="param-section-title clickable"
                        onClick={() => setExpandedBody(!expandedBody)}
                    >
                        <IconDocument size={13} /> Request Body
                        <span className="expand-icon">{expandedBody ? '▾' : '▸'}</span>
                    </h4>
                    {expandedBody && (
                        <div className="body-fields">
                            {endpoint.requestBody.schema.map(field => renderSchemaField(field, values, handleChange, missingFields))}
                        </div>
                    )}
                </div>
            )}

            {pathParams.length === 0 && queryParams.length === 0 && headerParams.length === 0 && !endpoint.requestBody && (
                <div className="no-params">
                    <span className="no-params-icon">✨</span>
                    <p>This endpoint has no parameters — just hit Try It!</p>
                </div>
            )}
        </div>
    );
}

function renderParamInput(
    param: Parameter,
    values: Record<string, string>,
    onChange: (name: string, value: string) => void,
    missingFields: string[] = [],
) {
    const isMissing = missingFields.includes(param.name);
    return (
        <div key={param.name} className={`param-field${isMissing ? ' field-missing' : ''}`}>
            <label className="param-label">
                <span className="param-name">{param.name}</span>
                {param.required && <span className="required-badge">required</span>}
                <span className="param-type">{param.type}</span>
            </label>
            {param.description && <p className="param-description">{param.description}</p>}
            {param.enum ? (
                <select
                    className="param-input"
                    value={values[param.name] || param.default || ''}
                    onChange={(e) => onChange(param.name, e.target.value)}
                >
                    <option value="">Select...</option>
                    {param.enum.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
            ) : (
                <input
                    className="param-input"
                    type="text"
                    value={values[param.name] || ''}
                    onChange={(e) => onChange(param.name, e.target.value)}
                    placeholder={param.example || param.default || `Enter ${param.name}`}
                />
            )}
        </div>
    );
}

function renderSchemaField(
    field: SchemaField,
    values: Record<string, string>,
    onChange: (name: string, value: string) => void,
    missingFields: string[] = [],
) {
    if (field.type === 'object' && field.nested) {
        return (
            <div key={field.name} className="nested-field">
                <label className="param-label">
                    <span className="param-name">{field.name}</span>
                    {field.required && <span className="required-badge">required</span>}
                    <span className="param-type">object</span>
                </label>
                <div className="nested-fields">
                    {field.nested.map(f => renderSchemaField(f, values, onChange, missingFields))}
                </div>
            </div>
        );
    }

    const isMissing = missingFields.includes(field.name);
    return (
        <div key={field.name} className={`param-field${isMissing ? ' field-missing' : ''}`}>
            <label className="param-label">
                <span className="param-name">{field.name}</span>
                {field.required && <span className="required-badge">required</span>}
                <span className="param-type">{field.type}</span>
            </label>
            {field.description && <p className="param-description">{field.description}</p>}
            {field.enum ? (
                <select
                    className="param-input"
                    value={values[field.name] || ''}
                    onChange={(e) => onChange(field.name, e.target.value)}
                >
                    <option value="">Select...</option>
                    {field.enum.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
            ) : field.type === 'boolean' ? (
                <select
                    className="param-input"
                    value={values[field.name] || ''}
                    onChange={(e) => onChange(field.name, e.target.value)}
                >
                    <option value="">Select...</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            ) : (
                <input
                    className="param-input"
                    type="text"
                    value={values[field.name] || ''}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    placeholder={
                        field.example !== undefined ? String(field.example) :
                            field.default !== undefined ? String(field.default) :
                                `Enter ${field.name}`
                    }
                />
            )}
        </div>
    );
}
