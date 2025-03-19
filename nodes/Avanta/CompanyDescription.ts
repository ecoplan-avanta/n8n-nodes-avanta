import type { IExecuteFunctions, ILoadOptionsFunctions, INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import {getSearchFilters, magentoApiRequest} from './GenericFunctions';

// Statische Operationen für Company
export const companyOperations: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['company'],
            },
        },
        options: [
            {
                name: 'Create/Update',
                value: 'create',
                description: 'Create or update a company',
                action: 'Create or update a company',
            },
            {
                name: 'Delete',
                value: 'delete',
                description: 'Delete a company',
                action: 'Delete a company',
            },
            {
                name: 'Get',
                value: 'get',
                description: 'Get a company',
                action: 'Get a company',
            },
            {
                name: 'Get Many',
                value: 'getAll',
                description: 'Get many companies',
                action: 'Get many companies',
            },
        ],
        default: 'create',
    },
];

export const companyFields: INodeProperties[] = [
    {
        displayName: 'Company Fields',
        name: 'fields',
        type: 'resourceMapper',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
            show: {
                resource: ['company'],
                operation: ['create'],
            },
        },
        typeOptions: {
            resourceMapper: {
                resourceMapperMethod: 'getDynamicFieldOptions',
                mode: 'add',
                addAllFields: false
            },
        },
    },

    /* -------------------------------------------------------------------------- */
    /*                                   customer:delete			              */
    /* -------------------------------------------------------------------------- */
    {
        displayName: 'Customer ID',
        name: 'customer_id',
        type: 'string',
        required: true,
        default: '',
        displayOptions: {
            show: {
                resource: ['company'],
                operation: ['delete', 'get'],
            },
        },
    },

    /* -------------------------------------------------------------------------- */
    /*                                   customer:getAll			              */
    /* -------------------------------------------------------------------------- */
    {
        displayName: 'Return All',
        name: 'returnAll',
        type: 'boolean',
        displayOptions: {
            show: {
                resource: ['company'],
                operation: ['getAll'],
            },
        },
        default: false,
        description: 'Whether to return all results or only up to a given limit',
    },
    {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        displayOptions: {
            show: {
                resource: ['company'],
                operation: ['getAll'],
                returnAll: [false],
            },
        },
        typeOptions: {
            minValue: 1,
            maxValue: 10,
        },
        default: 5,
        description: 'Max number of results to return',
    },
    ...getSearchFilters('company', 'getSystemAttributes', 'getSystemAttributes')
];


// Funktion zum Abrufen der dynamischen Felder von der API (zur Laufzeit verwendet)
export async function fetchDynamicFields(this: IExecuteFunctions): Promise<INodeProperties[]> {
    try {
        const body = {
            interfaceName: 'Ecoplan\\Proline\\Api\\Data\\CompanyInterface',
        };
        console.log('Fetching dynamic fields from API...');
        const response = await magentoApiRequest.call(this, 'POST', '/rest/all/V1/proline/connector/interfaceMetaData', body);
        console.log('API response for fetchDynamicFields:', response);

        // Dynamische Felder von der API, exklusive der statisch definierten Pflichtfelder
        const staticFields = ['customer_id', 'name', 'company_customergroup_id', 'company_role_id', 'sales_org_id', 'status'];
        const dynamicFields: INodeProperties[] = response.fields
            .filter((field: any) => !staticFields.includes(field.name))
            .map((field: any) => ({
                displayName: field.displayName,
                name: field.name,
                type: field.type || 'string',
                required: field.required || false,
                default: field.default || '',
                displayOptions: {
                    show: {
                        resource: ['CompanyInterface'],
                        operation: ['create'],
                    },
                },
                description: field.description || '',
            }));

        console.log('Dynamic fields parsed:', dynamicFields);
        return dynamicFields;
    } catch (error) {
        console.error('Error fetching dynamic fields:', error.message);
        throw new Error(`Failed to fetch dynamic fields: ${error.message}`);
    }
}

// Funktion zum Abrufen der dynamischen Feld-Optionen für das UI
export async function getDynamicFieldOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    try {
        const body = {
            interfaceName: 'Ecoplan\\Proline\\Api\\Data\\CompanyInterface',
        };
        const response = await magentoApiRequest.call(this, 'POST', 'all/V1/proline/connector/interfaceMetaData', body);
        return response;
    } catch (error) {
        console.error('Error fetching dynamic field options:', error.message);
        throw new Error(`Failed to fetch dynamic field options: ${error.message}`);
    }
}
