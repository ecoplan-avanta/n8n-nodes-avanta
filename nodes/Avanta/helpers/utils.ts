import type {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
	INodeExecutionData
} from 'n8n-workflow';

import { NodeApiError } from 'n8n-workflow';
import { magentoApiRequest, magentoApiRequestAllItems } from '../transport';
import type { Search } from '../transport';

export function prepareErrorData(this: IExecuteFunctions, error: any, i: number) {
	let description = error.description;

	try {
		description = JSON.parse(error.description as string);
	} catch (err) {
	}

	return this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray({error: error.message, description}),
		{itemData: {item: i}},
	);
}

export const sort = (a: { name: string }, b: { name: string }) => {
	if (a.name < b.name) {
		return -1;
	}
	if (a.name > b.name) {
		return 1;
	}
	return 0;
};


export function formatExtensionAttributes(this: IExecuteFunctions, additionalFields: any) {
	if (additionalFields.extension_attributes) {
		const extensionAttributesRaw = (additionalFields.extension_attributes as IDataObject).extension_attribute as IDataObject[];

		// Umwandlung in ein Objekt anstelle eines Arrays
		const formattedExtensionAttributes: IDataObject = {};
		extensionAttributesRaw.forEach(attr => {
			formattedExtensionAttributes[attr.attribute_code as string] = attr.value;
		});

		// Ergebnis zurück in additionalFields einfügen
		additionalFields.extension_attributes = formattedExtensionAttributes;
	}
	return additionalFields;
}

export function getSearchFilters(
	resource: string,
	filterableAttributeFunction: string | null = null,
	sortableAttributeFunction: string | null = null,
): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			displayOptions: {
				show: {
					resource: [resource],
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
					resource: [resource],
					operation: ['getAll'],
					returnAll: [false],
				},
			},
			typeOptions: {
				minValue: 1,
			},
			default: 50,
			description: 'Max number of results to return',
		},
		{
			displayName: 'Filter',
			name: 'filterType',
			type: 'options',
			options: [
				{
					name: 'None',
					value: 'none',
				},
				{
					name: 'JSON',
					value: 'json',
				},
			],
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
				},
			},
			default: 'none',
		},
		{
			displayName:
				'See <a href="https://devdocs.magento.com/guides/v2.4/rest/performing-searches.html" target="_blank">Magento guide</a> to creating filters',
			name: 'jsonNotice',
			type: 'notice',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
					filterType: ['json'],
				},
			},
			default: '',
		},
		{
			displayName: 'Filters (JSON)',
			name: 'filterJson',
			type: 'string',
			displayOptions: {
				show: {
					resource: [resource],
					operation: ['getAll'],
					filterType: ['json'],
				},
			},
			default: '',
		},
	];
}

const buildQuery = (
	context: IExecuteFunctions,
	index: number,
	returnAll: boolean,
): Search => {
	const withPositions = context.getNodeParameter('withPositions', index, false) as boolean;
	const filterType = context.getNodeParameter('filterType', index, 'none') as string;
	const qs: Search = { withPositions, search_criteria: {} };

	if (filterType === 'json') {
		const filterJson = context.getNodeParameter('filterJson', index, '') as string;
		if (filterJson) {
			const parsedJson = validateJSON(filterJson);
			if (!parsedJson) {
				throw new NodeApiError(context.getNode(), { message: 'Filter (JSON) must be valid JSON' });
			}
			Object.assign(qs, parsedJson);
		}
	}

	qs.search_criteria!.page_size = returnAll
		? 1000
		: Math.max(1, context.getNodeParameter('limit', index, 5) as number);

	return qs;
};

export async function executeGetAll(
	this: IExecuteFunctions,
	endpoint: string,
): Promise<INodeExecutionData[]> {
	if (!endpoint) {
		throw new NodeApiError(this.getNode(), { message: 'Endpoint must not be empty' });
	}

	const returnData: INodeExecutionData[] = [];

	for (const [index] of this.getInputData().entries()) {
		try {
			const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
			const qs = buildQuery(this, index, returnAll);

			const response = returnAll
				? await magentoApiRequestAllItems.call(this, 'items', 'GET', endpoint, {}, qs as IDataObject)
				: await magentoApiRequest.call(this, 'GET', endpoint, {}, qs as IDataObject);

			const responseData = Array.isArray(response.items) ? response.items : [response];

			returnData.push(
				...this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: index } },
				),
			);
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push(
					...this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: (error as Error).message }),
						{ itemData: { item: index } },
					),
				);
				continue;
			}
			throw new NodeApiError(this.getNode(), { message: (error as Error).message });
		}
	}

	return returnData;
}

export function validateJSON(json: string | undefined): any {
	let result;
	try {
		result = JSON.parse(json!);
	} catch (exception) {
		result = undefined;
	}
	return result;
}

export function getProductOptionalFields(): INodeProperties[] {
	return [
		{
			displayName: 'Attribute Set Name or ID',
			name: 'attribute_set_id',
			type: 'options',
			description:
				'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			displayOptions: {
				show: {
					'/operation': ['update'],
				},
			},
			typeOptions: {
				loadOptionsMethod: 'getAttributeSets',
			},
			default: '',
		},
		{
			displayName: 'Name',
			name: 'name',
			type: 'string',
			displayOptions: {
				show: {
					'/operation': ['update'],
				},
			},
			default: '',
		},
		// {
		// 	displayName: 'Custom Attributes',
		// 	name: 'customAttributes',
		// 	type: 'fixedCollection',
		// 	typeOptions: {
		// 		multipleValues: true,
		// 	},
		// 	default: '',
		// 	placeholder: 'Add Custom Attribute',
		// 	options: [
		// 		{
		// 			displayName: 'Custom Attribute',
		// 			name: 'customAttribute',
		// 			values: [
		// 				{
		// 					displayName: 'Attribute Code',
		// 					name: 'attribute_code',
		// 					type: 'options',
		// 					typeOptions: {
		// 						loadOptionsMethod: 'getProductAttributes',
		// 					},
		// 					default: '',
		// 				},
		// 				{
		// 					displayName: 'Value',
		// 					name: 'value',
		// 					type: 'string',
		// 					default: '',
		// 				},
		// 			],
		// 		},
		// 	],
		// },
		// {
		// 	displayName: 'Parent Category ID',
		// 	name: 'category',
		// 	type: 'options',
		// 	typeOptions: {
		// 		loadOptionsMethod: 'getCategories',
		// 	},
		// 	default: '',
		// },
		{
			displayName: 'Price',
			name: 'price',
			type: 'number',
			displayOptions: {
				show: {
					'/operation': ['update'],
				},
			},
			default: 0,
		},
		{
			displayName: 'Status',
			name: 'status',
			type: 'options',
			options: [
				{
					name: 'Enabled',
					value: 1,
				},
				{
					name: 'Disabled',
					value: 2,
				},
			],
			default: 1,
		},
		{
			displayName: 'Type Name or ID',
			name: 'type_id',
			type: 'options',
			description:
				'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			typeOptions: {
				loadOptionsMethod: 'getProductTypes',
			},
			default: '',
		},
		{
			displayName: 'Visibility',
			name: 'visibility',
			type: 'options',
			options: [
				{
					name: 'Not Visible',
					value: 1,
				},
				{
					name: 'Catalog',
					value: 2,
				},
				{
					name: 'Search',
					value: 3,
				},
				{
					name: 'Catalog & Search',
					value: 4,
				},
			],
			default: 4,
		},
		{
			displayName: 'Weight (LBS)',
			name: 'weight',
			type: 'number',
			default: 0,
		},
	];
}

export function formatDate(input: string | undefined): string | undefined {
	if (!input) return undefined;

	// Handle ISO 8601 (e.g., 2021-05-13T00:00:00.000Z)
	if (input.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
		const date = new Date(input);
		if (isNaN(date.getTime())) return undefined;
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
	}

	// Handle German format (e.g., 13.05.2021 or 13.05.2021 00:00:00)
	const germanMatch = input.match(/^(\d{2})\.(\d{2})\.(\d{4})(\s+\d{2}:\d{2}:\d{2})?$/);
	if (germanMatch) {
		const [, day, month, year, time] = germanMatch;
		const timePart = time ? time.trim() : '00:00:00';
		const date = new Date(`${year}-${month}-${day}T${timePart}Z`);
		if (isNaN(date.getTime())) return undefined;
		return `${year}-${month}-${day} ${timePart}`;
	}

	// Handle YYYY-MM-DD or YYYY-MM-DD HH:mm:ss
	const standardMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})(\s+\d{2}:\d{2}:\d{2})?$/);
	if (standardMatch) {
		const [, year, month, day, time] = standardMatch;
		const timePart = time ? time.trim() : '00:00:00';
		const date = new Date(`${year}-${month}-${day}T${timePart}Z`);
		if (isNaN(date.getTime())) return undefined;
		return `${year}-${month}-${day} ${timePart}`;
	}

	return undefined; // Return undefined for invalid dates
}