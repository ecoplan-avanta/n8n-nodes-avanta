import { INodeProperties } from 'n8n-workflow';

export function updateDisplayOptions(
	displayOptions: INodeProperties['displayOptions'],
	properties: INodeProperties[],
): INodeProperties[] {
	return properties.map((property) => ({
		...property,
		displayOptions: {
			...(property.displayOptions || {}),
			...displayOptions,
		},
	}));
}
