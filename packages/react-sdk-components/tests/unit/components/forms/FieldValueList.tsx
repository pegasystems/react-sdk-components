import React from 'react';

const FieldValueList = ({ name, value, variant }) => (
  <div data-testid='field-value-list'>
    <span>{name}</span>
    <span>{value}</span>
    <span>{variant}</span>
  </div>
);

export default FieldValueList;
