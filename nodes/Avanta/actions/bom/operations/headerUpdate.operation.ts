import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { updateDisplayOptions } from '../../../helpers/displayOptions';
import { magentoApiRequest } from '../../../transport';
import { prepareErrorData, validateJSON } from '../../../helpers/utils';

const properties: INodeProperties[] = [
  {
    displayName: 'BOM ID',
    name: 'bomId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: {
      show: {
        resource: ['bom'],
        operation: ['headerUpdate'],
      },
    },
  },
  {
    displayName: 'Body (JSON)',
    name: 'bodyJson',
    type: 'string',
    required: true,
    default: '',
    typeOptions: { rows: 6 },
    displayOptions: {
      show: {
        resource: ['bom'],
        operation: ['headerUpdate'],
      },
    },
  },
];

const displayOptions = {
  show: {
    resource: ['bom'],
    operation: ['headerUpdate'],
  },
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const bomId = this.getNodeParameter('bomId', i) as string;
      const bodyJson = this.getNodeParameter('bodyJson', i, '') as string;
      const payload = validateJSON(bodyJson);
      if (!payload) throw new Error('Body (JSON) must be valid JSON');

      const res = await magentoApiRequest.call(this, 'PUT', `/V1/ecoplan-bom/bomheader/${bomId}`, payload);
      returnData.push(
        ...this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray([res]), { itemData: { item: i } }),
      );
    } catch (error) {
      if (this.continueOnFail()) {
        returnData.push(...prepareErrorData.call(this, error, i));
        continue;
      }
      throw error;
    }
  }

  return returnData;
}
