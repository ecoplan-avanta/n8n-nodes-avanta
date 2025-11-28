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
      { name: 'Create or update a BOM', value: 'importBom', description: 'Create or update a BOM', action: 'Create or update a BOM' },
    ],
    default: 'importBom',
  },
  ...importBom.description,
];
