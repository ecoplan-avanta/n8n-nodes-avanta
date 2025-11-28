import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { updateDisplayOptions } from '../../../helpers/displayOptions';
import { createApiRequest } from '../../../transport';
import { prepareErrorData, validateJSON } from '../../../helpers/utils';

const properties: INodeProperties[] = [
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
        operation: ['itemCreate'],
      },
    },
    description: 'Raw JSON payload for the BOM item as expected by Magento',
  },
];

const displayOptions = {
  show: {
    resource: ['bom'],
    operation: ['itemCreate'],
  },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/ecoplan-bom/bomitem';

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
  const bulk = this.getNodeParameter('bulk', 0) as boolean;
  const items = this.getInputData();
  const data: any[] = [];
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const bodyJson = this.getNodeParameter('bodyJson', i, '') as string;
      const parsed = validateJSON(bodyJson);
      if (!parsed) throw new Error('Body (JSON) must be valid JSON');

      if (!bulk) {
        const executionData = await createApiRequest.call(this, parsed, restUrl, false, i);
        returnData.push(...executionData);
      } else {
        data.push(parsed);
      }
    } catch (error) {
      if (this.continueOnFail()) {
        returnData.push(...prepareErrorData.call(this, error, i));
        continue;
      }
      throw error;
    }
  }

  if (bulk && data.length) {
    try {
      const executionData = await createApiRequest.call(this, data, restUrl);
      returnData.push(...executionData);
    } catch (error) {
      if (this.continueOnFail()) {
        returnData.push(...prepareErrorData.call(this, error, 0));
      } else {
        throw error;
      }
    }
  }

  return returnData;
}
