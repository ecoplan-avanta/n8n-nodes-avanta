import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

import { updateDisplayOptions } from '../../helpers/displayOptions';
import { createApiRequest } from '../../transport';
import { prepareErrorData } from '../../helpers/utils';

const properties: INodeProperties[] = [
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    displayOptions: { show: { resource: ['category'], operation: ['create'] } },
  },
  {
    displayName: 'Is Active',
    name: 'is_active',
    type: 'boolean',
    required: true,
    default: true,
    displayOptions: { show: { resource: ['category'], operation: ['create'] } },
  },
  {
    displayName: 'External ID',
    name: 'external_id',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['category'], operation: ['create'] } },
    description: 'Maps to Ecoplan CategoryInterface::getExternalId() (snake_case key required)',
  },
  {
    displayName: 'External Parent ID',
    name: 'external_parent_id',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['category'], operation: ['create'] } },
    description: 'Maps to Ecoplan CategoryInterface::getExternalParentId() (snake_case key required)',
  },
  {
    displayName: 'ID',
    name: 'id',
    type: 'number',
    default: '',
    displayOptions: { show: { resource: ['category'], operation: ['create'] } },
  },
  {
    displayName: 'Parent ID',
    name: 'parent_id',
    type: 'number',
    default: '',
    displayOptions: { show: { resource: ['category'], operation: ['create'] } },
  },
  {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['category'], operation: ['create'] } },
        options: [
          { displayName: 'URL Key', name: 'url_key', type: 'string', default: '' },
          { displayName: 'Include in Menu', name: 'include_in_menu', type: 'boolean', default: true },
          { displayName: 'Position', name: 'position', type: 'number', default: '' },
          // Flexible Custom Attributes (JSON or UI collection)
          {
            displayName: 'Custom Attributes (Flexible)',
            name: 'customAttributes',
            type: 'fixedCollection',
            typeOptions: { multipleValues: false },
            default: {},
            options: [
              {
                name: 'customAttribute',
                displayName: 'Custom Attributes',
                values: [
                  {
                    displayName: 'Select Input Mode',
                    name: 'inputMode',
                    type: 'options',
                    options: [
                      { name: 'Collection', value: 'collection' },
                      { name: 'Raw JSON', value: 'json' },
                    ],
                    default: 'collection',
                  },
                  {
                    displayName: 'Attributes',
                    name: 'attributes',
                    type: 'fixedCollection',
                    typeOptions: { multipleValues: true },
                    default: {},
                    displayOptions: { show: { inputMode: ['collection'] } },
                    options: [
                      {
                        name: 'attribute',
                        displayName: 'Attribute',
                        values: [
                          { displayName: 'Attribute Code', name: 'attribute_code', type: 'string', required: true, default: '' },
                          { displayName: 'Value', name: 'value', type: 'string', required: true, default: '' },
                        ],
                      },
                    ],
                  },
                  {
                    displayName: 'Attributes (JSON)',
                    name: 'customAttributesJson',
                    type: 'string',
                    typeOptions: { rows: 6 },
                    default: '',
                    displayOptions: { show: { inputMode: ['json'] } },
                    description: 'Provide an array: [{"attribute_code":"proline_visibility_group","value":"0"}]',
                  },
                ],
              },
            ],
          },
        ],
      },
];

const displayOptions = {
  show: {
    resource: ['category'],
    operation: ['create'],
  },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/connector/category';

function normalizeCategoryPayload(category: any) {
  // Map common synonyms to Magento‑expected snake_case keys
  const synonyms: Record<string, string> = {
    externalId: 'external_id',
    ExternalId: 'external_id',
    ProlineExternalId: 'external_id',
    proline_external_id: 'external_id',
    externalParentId: 'external_parent_id',
    ExternalParentId: 'external_parent_id',
    proline_external_parent_id: 'external_parent_id',
  };

  const allowedTopLevel = new Set([
    'name',
    'is_active',
    'external_id',
    'external_parent_id',
    'id',
    'parent_id',
    'url_key',
    'include_in_menu',
    'position',
    'custom_attributes',
  ]);

  const result: any = {};
  for (const [key, value] of Object.entries(category)) {
    const mapped = synonyms[key] ?? key;
    if (allowedTopLevel.has(mapped)) {
      result[mapped] = value;
    }
  }
  return result;
}

export async function execute(this: IExecuteFunctions): Promise<INodeExecutionData[]> {
  const bulk = this.getNodeParameter('bulk', 0) as boolean;
  const inputItems = this.getInputData();
  const data: any[] = [];
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < inputItems.length; i++) {
    try {
      const additionalFields = (this.getNodeParameter('additionalFields', i, {}) as any) || {};

      // Custom attributes: support flexible (JSON or UI collection) and legacy collection
      let customAttributes: any[] = [];

      // 1) Flexible block
      if (additionalFields.customAttributes) {
        const caWrap = additionalFields.customAttributes as any;
        const entry = Array.isArray(caWrap?.customAttribute)
          ? caWrap.customAttribute[0]
          : caWrap.customAttribute || caWrap; // tolerate either shape

        if (entry?.inputMode === 'json' && entry.customAttributesJson) {
          try {
            const parsed = JSON.parse(entry.customAttributesJson as string);
            if (!Array.isArray(parsed)) throw new Error('Custom Attributes JSON must be an array');
            customAttributes = parsed.map((attr: any) => ({
              attribute_code: attr.attribute_code ?? attr.attributeCode,
              value: attr.value,
            }));
          } catch (err) {
            throw new NodeOperationError(this.getNode(), `Invalid JSON in Custom Attributes: ${(err as Error).message}`);
          }
        } else if (entry?.attributes) {
          const attrs = entry.attributes as any;
          const rows = Array.isArray(attrs) ? attrs : attrs.attribute;
          if (Array.isArray(rows)) {
            customAttributes = rows.map((r: any) => ({
              attribute_code: r.attribute_code,
              value: r.value,
            }));
          }
        }
      }

      const categoryRaw: any = {
        name: this.getNodeParameter('name', i) as string,
        is_active: this.getNodeParameter('is_active', i) as boolean,
      };

      // Optional identifiers
      const externalId = this.getNodeParameter('external_id', i, '') as string;
      const externalParentId = this.getNodeParameter('external_parent_id', i, '') as string;
      const id = this.getNodeParameter('id', i, '') as number | '';
      const parentId = this.getNodeParameter('parent_id', i, '') as number | '';
      if (externalId !== '') categoryRaw.external_id = externalId;
      if (externalParentId !== '') categoryRaw.external_parent_id = externalParentId;
      if (id !== '') categoryRaw.id = id;
      if (parentId !== '') categoryRaw.parent_id = parentId;

      // Additional simple fields
      if (additionalFields.url_key) categoryRaw.url_key = additionalFields.url_key;
      if (typeof additionalFields.include_in_menu === 'boolean') categoryRaw.include_in_menu = additionalFields.include_in_menu;
      if (additionalFields.position !== undefined && additionalFields.position !== '') categoryRaw.position = additionalFields.position;
      if (customAttributes.length > 0) categoryRaw.custom_attributes = customAttributes;

      const category = normalizeCategoryPayload(categoryRaw);

      const payload = { category };

      if (!bulk) {
        const executionData = await createApiRequest.call(this, payload, restUrl, false, i);
        returnData.push(...executionData);
      } else {
        data.push(payload);
      }
    } catch (error) {
      if (this.continueOnFail()) {
        returnData.push(...prepareErrorData.call(this, error, i));
        continue;
      }
      throw new NodeApiError(this.getNode(), error as JsonObject);
    }
  }

  if (bulk && data.length > 0) {
    try {
      const executionData = await createApiRequest.call(this, data, restUrl, true, 0);
      returnData.push(...executionData);
    } catch (error) {
      if (this.continueOnFail()) {
        returnData.push(...prepareErrorData.call(this, error, 0));
      } else {
        throw new NodeApiError(this.getNode(), error as JsonObject);
      }
    }
  }

  return returnData;
}
