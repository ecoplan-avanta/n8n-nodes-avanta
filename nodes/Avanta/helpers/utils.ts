import type {
	IDataObject,
	IExecuteFunctions,
	INodeProperties,
} from 'n8n-workflow';

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
	filterableAttributeFunction: string,
	sortableAttributeFunction: string,
): INodeProperties[] {
	return [
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
