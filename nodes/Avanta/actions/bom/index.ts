import type { INodeProperties } from 'n8n-workflow';

import * as headerCreate from './operations/headerCreate.operation';
import * as headerUpdate from './operations/headerUpdate.operation';
import * as headerDelete from './operations/headerDelete.operation';

import * as itemCreate from './operations/itemCreate.operation';
import * as itemUpdate from './operations/itemUpdate.operation';
import * as itemDelete from './operations/itemDelete.operation';

import * as importBom from './operations/import.operation';

export {
  headerCreate,
  headerUpdate,
  headerDelete,
  itemCreate,
  itemUpdate,
  itemDelete,
  importBom,
};

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
      { name: 'Header: Create/Save', value: 'headerCreate', description: 'Create or update a BOM header', action: 'Create or update a BOM header' },
      { name: 'Header: Update', value: 'headerUpdate', description: 'Update a BOM header by ID', action: 'Update a BOM header' },
      { name: 'Header: Delete', value: 'headerDelete', description: 'Delete a BOM header by ID', action: 'Delete a BOM header' },
      { name: 'Item: Create/Save', value: 'itemCreate', description: 'Create or update a BOM item', action: 'Create or update a BOM item' },
      { name: 'Item: Update', value: 'itemUpdate', description: 'Update a BOM item by ID', action: 'Update a BOM item' },
      { name: 'Item: Delete', value: 'itemDelete', description: 'Delete a BOM item by ID', action: 'Delete a BOM item' },
      { name: 'Create or update a BOM', value: 'importBom', description: 'Create or update a BOM', action: 'Create or update a BOM' },
    ],
    default: 'headerCreate',
  },
  ...headerCreate.description,
  ...headerUpdate.description,
  ...headerDelete.description,
  ...itemCreate.description,
  ...itemUpdate.description,
  ...itemDelete.description,
  ...importBom.description,
];
