import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';

import { updateDisplayOptions } from '../../../helpers/displayOptions';
import { magentoApiRequest } from '../../../transport';
import { prepareErrorData } from '../../../helpers/utils';

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
        operation: ['headerDelete'],
      },
    },
  },
];

const displayOptions = {
  show: {
    resource: ['bom'],
    operation: ['headerDelete'],
  },
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const bomId = this.getNodeParameter('bomId', i) as string;
      const res = await magentoApiRequest.call(this, 'DELETE', `/V1/ecoplan-bom/bomheader/${bomId}`);
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
