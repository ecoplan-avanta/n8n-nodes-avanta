import type { INodeProperties } from 'n8n-workflow';

import * as importBom from './operations/import.operation';

export { importBom };

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: {
      show: {
        resource: ['bom'],
      },
    },
    options: [
      { name: 'Create or Update', value: 'importBom', description: 'Create a new bill of materials, or update it if it already exists', action: 'Create or update a bill of materials' },
    ],
    default: 'importBom',
  },
  ...importBom.description,
];
