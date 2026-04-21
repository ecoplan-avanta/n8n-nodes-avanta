import type {IDataObject, ILoadOptionsFunctions, INodePropertyOptions, IExecuteFunctions} from 'n8n-workflow';
import {sort} from "../helpers/utils";
import {magentoApiRequest, magentoApiRequestAllItems} from "../transport";
import type {CustomerAttributeMetadata, Search} from "../transport";
import type {ProductAttribute } from '../transport/types';

export async function getCountries(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	//https://magento.redoc.ly/2.3.7-admin/tag/directorycountries
	const countries = await magentoApiRequest.call(
		this,
		'GET',
		'/V1/directory/countries',
	);
	const returnData: INodePropertyOptions[] = [];
	for (const country of countries) {
		returnData.push({
			name: country.full_name_english,
			value: country.id,
		});
	}
	returnData.sort(sort);
	return returnData;
}

export async function getGroups(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	//https://magento.redoc.ly/2.3.7-admin/tag/customerGroupsdefault#operation/customerGroupManagementV1GetDefaultGroupGet
	const group = await magentoApiRequest.call(
		this,
		'GET',
		'/V1/customerGroups/default',
	);
	const returnData: INodePropertyOptions[] = [];
	returnData.push({
		name: group.code,
		value: group.id,
	});
	returnData.sort(sort);
	return returnData;
}

export async function getStoreGroups(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	//https://magento.redoc.ly/2.3.7-admin/tag/storestoreConfigs
	const stores = await magentoApiRequest.call(
		this,
		'GET',
		'/V1/store/storeGroups',
	);
	const returnData: INodePropertyOptions[] = [];

	for (const store of stores) {
		returnData.push({
			name: store.name,
			value: store.id,
		});
	}
	returnData.sort(sort);
	return returnData;
}


export async function getStores(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	//https://magento.redoc.ly/2.3.7-admin/tag/storestoreConfigs
	const stores = await magentoApiRequest.call(
		this,
		'GET',
		'/V1/store/storeConfigs',
	);
	const returnData: INodePropertyOptions[] = [];
	for (const store of stores) {
		returnData.push({
			name: store.base_url,
			value: store.id,
		});
	}
	returnData.sort(sort);
	return returnData;
}

export async function getStoreViews(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
    //https://magento.redoc.ly/2.3.7-admin/tag/storeViews
    const storeViews = await magentoApiRequest.call(
        this,
        'GET',
        '/V1/store/storeViews',
    );
    const returnData: INodePropertyOptions[] = [];
    for (const storeView of storeViews) {
        returnData.push({
            name: storeView.name,
            value: storeView.id,
        });
    }
    returnData.sort(sort);
    return returnData;
}


export async function getWebsites(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	//https://magento.redoc.ly/2.3.7-admin/tag/storewebsites
	const websites = await magentoApiRequest.call(
		this,
		'GET',
		'/V1/store/websites',
	);
	const returnData: INodePropertyOptions[] = [];
	for (const website of websites) {
		returnData.push({
			name: website.name,
			value: website.id,
		});
	}
	returnData.sort(sort);
	return returnData;
}

export async function getSalesOrgs(this: ILoadOptionsFunctions | IExecuteFunctions): Promise<INodePropertyOptions[]> {
	//https://magento.redoc.ly/2.3.7-admin/tag/storewebsites
	const salesOrgs = await magentoApiRequest.call(
		this,
		'GET',
		'/V1/proline-admin/salesorg',
	);
	const returnData: INodePropertyOptions[] = [];
	for (const salesOrg of salesOrgs.items) {
		returnData.push({
			name: salesOrg.name,
			value: salesOrg.id
		});
	}
	returnData.sort(sort);
	return returnData;
}

export async function getGroupIdBySalesOrg(this: ILoadOptionsFunctions | IExecuteFunctions): Promise<INodePropertyOptions[]> {
	//https://magento.redoc.ly/2.3.7-admin/tag/storewebsites
	const salesOrgs = await magentoApiRequest.call(
		this,
		'GET',
		'/V1/proline-admin/salesorg',
	);
	const returnData: INodePropertyOptions[] = [];
	for (const salesOrg of salesOrgs.items) {
		returnData.push({
			name: salesOrg.name,
			value: salesOrg.group_id
		});
	}
	returnData.sort(sort);
	return returnData;
}

export async function getCompanyRoles(this: ILoadOptionsFunctions | IExecuteFunctions): Promise<INodePropertyOptions[]> {
	let qs: Search = {
		"search_criteria": {
			"filter_groups": [
				{
					"filters": [
						{
							"field": "role_type",
							"value": "sales,company",
							"condition_type": "in"
						}
					]
				}
			]
		}
	};
	const companyRoles = await magentoApiRequest.call(
		this,
		'GET',
		'/V1/proline-admin/companyrole',
		{},
		qs as unknown as IDataObject,
	);
	const returnData: INodePropertyOptions[] = [];
	for (const companyRole of companyRoles.items) {
		if (companyRole.role_name && companyRole.external_id) {
			returnData.push({
				name: companyRole.role_name + ' (' + companyRole.role_type + ')' as string,
				value: companyRole.role_id as number,
			});
		}
	}
	returnData.sort(sort);
	return returnData;
}

export async function getCompanyRolesExternalId(this: ILoadOptionsFunctions | IExecuteFunctions): Promise<INodePropertyOptions[]> {
	let qs: Search = {
		"search_criteria": {
			"filter_groups": [
				{
					"filters": [
						{
							"field": "role_type",
							"value": "sales,company",
							"condition_type": "in"
						}
					]
				}
			]
		}
	};
	const companyRoles = await magentoApiRequest.call(
		this,
		'GET',
		'/V1/proline-admin/companyrole',
		{},
		qs as unknown as IDataObject,
	);
	const returnData: INodePropertyOptions[] = [];
	for (const companyRole of companyRoles.items) {
		if (companyRole.role_name && companyRole.external_id) {
			returnData.push({
				name: companyRole.role_name + ' (' + companyRole.role_type + ')' as string,
				value: companyRole.external_id as string,
			});
		}
	}
	returnData.sort(sort);
	return returnData;
}

export async function getCustomAttributes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const resource = this.getCurrentNodeParameter('resource') as string;
	const attributes = (await magentoApiRequest.call(
		this,
		'GET',
		`/V1/attributeMetadata/${resource}`,
	)) as CustomerAttributeMetadata[];
	const returnData: INodePropertyOptions[] = [];
	for (const attribute of attributes) {
		if (attribute.system === false && attribute.frontend_label !== '') {
			returnData.push({
				name: attribute.frontend_label as string,
				value: attribute.attribute_code as string,
			});
		}
	}
	returnData.sort(sort);
	return returnData;
}

export async function getSystemAttributes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const resource = this.getCurrentNodeParameter('resource') as string;
	const attributes = (await magentoApiRequest.call(
		this,
		'GET',
		`/V1/attributeMetadata/${resource}`,
	)) as CustomerAttributeMetadata[];
	const returnData: INodePropertyOptions[] = [];
	for (const attribute of attributes) {
		if (attribute.system === true && attribute.frontend_label !== null) {
			returnData.push({
				name: attribute.frontend_label as string,
				value: attribute.attribute_code as string,
			});
		}
	}
	returnData.sort(sort);
	return returnData;
}

export async function getProductTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const types = (await magentoApiRequest.call(
		this,
		'GET',
		'/V1/products/types',
	)) as IDataObject[];
	const returnData: INodePropertyOptions[] = [];
	for (const type of types) {
		returnData.push({
			name: type.label as string,
			value: type.name as string,
		});
	}
	returnData.sort(sort);
	return returnData;
}

export async function getCategories(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const {items: categories} = (await magentoApiRequest.call(
		this,
		'GET',
		'/V1/categories/list',
		{},
		{
			search_criteria: {
				filter_groups: [
					{
						filters: [
							{
								field: 'is_active',
								condition_type: 'eq',
								value: 1,
							},
						],
					},
				],
			},
		},
	)) as { items: IDataObject[] };
	const returnData: INodePropertyOptions[] = [];
	for (const category of categories) {
		returnData.push({
			name: category.name as string,
			value: category.id as string,
		});
	}
	returnData.sort(sort);
	return returnData;
}

export async function getAttributeSets(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const {items: attributeSets} = (await magentoApiRequest.call(
		this,
		'GET',
		'/V1/products/attribute-sets/sets/list',
		{},
		{
			search_criteria: 0,
		},
	)) as { items: IDataObject[] };
	const returnData: INodePropertyOptions[] = [];
	for (const attributeSet of attributeSets) {
		returnData.push({
			name: attributeSet.attribute_set_name as string,
			value: attributeSet.attribute_set_id as string,
		});
	}
	returnData.sort(sort);
	return returnData;
}

export async function getExtensionAttributes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const resource = this.getNodeParameter('resource', 0) as string;
	const resourceMapping: Record<string, string> = {
		company: 'Ecoplan\\Proline\\Api\\Data\\CompanyInterface',
		companyAddress: 'Ecoplan\\Proline\\Api\\Data\\CompanyAddressInterface',
		orders: 'Ecoplan\\ProlineServiceCenter\\Api\\Data\\OrderHeadReportInterface',
		shipments: 'Ecoplan\\ProlineServiceCenter\\Api\\Data\\ShipmentHeadReportInterface',
		reshipments: 'Ecoplan\\ProlineServiceCenter\\Api\\Data\\ReshipmentHeadReportInterface',
		backorders: 'Ecoplan\\ProlineServiceCenter\\Api\\Data\\BackorderHeadReportInterface',
		invoices: 'Ecoplan\\ProlineServiceCenter\\Api\\Data\\InvoiceHeadReportInterface',
		creditmemos: 'Ecoplan\\ProlineServiceCenter\\Api\\Data\\CreditmemoHeadReportInterface',
		trackings: 'Ecoplan\\ProlineServiceCenter\\Api\\Data\\TrackingReportInterface',
		tickets: 'Ecoplan\\ProlineOffer\\Api\\Data\\TicketInterface',
		inquiries: 'Ecoplan\\ProlineOffer\\Api\\Data\\InquiryInterface',
		returns: 'Ecoplan\\Retoure\\Api\\Data\\RetoureHeadInterface',
		returnItems: 'Ecoplan\\Retoure\\Api\\Data\\RetoureItemInterface',
        downloads: 'Ecoplan\\ProlineDownloadCenter\\Api\\Data\\ItemRepositoryInterface'
    };

	const body = {
		interfaceName: resourceMapping[resource]
	};
	const attributes = await magentoApiRequest.call(
		this,
		'POST',
		'/V1/avanta/redoc/interfaceMetaData',
		body
	);
	const returnData: INodePropertyOptions[] = [];
	for (const attribute of attributes) {
		returnData.push({
			name: attribute.name,
			value: attribute.value
		});
	}
	returnData.sort(sort);
	return returnData;
}

export async function getProductLinkTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const types = (await magentoApiRequest.call(
		this,
		'GET',
		'/V1/products/links/types',
	)) as IDataObject[];
	const returnData: INodePropertyOptions[] = [];
	for (const type of types) {
		returnData.push({
			name: type.name as string,
			value: type.name as string,
		});
	}
	returnData.sort(sort);
	return returnData;
}


export async function getProductAttributes(
	this: ILoadOptionsFunctions,

	filter?: (attribute: ProductAttribute) => any,
	extraValue?: { name: string; value: string },
): Promise<INodePropertyOptions[]> {
	//https://magento.redoc.ly/2.3.7-admin/tag/productsattribute-setssetslist#operation/catalogAttributeSetRepositoryV1GetListGet

	let additionalAttributes = [
		'external_proline_visibility_group',
		'external_proline_company_whitelist_visibility'
	]
	let attributes: ProductAttribute[] = await magentoApiRequestAllItems.call(
		this,
		'items',
		'GET',
		'/V1/products/attributes',
		{},
		{
			search_criteria: 0,
		},
	);

	attributes = attributes.filter(
		(attribute) =>
			attribute.default_frontend_label !== undefined && attribute.default_frontend_label !== '',
	);

	if (filter) {
		attributes = attributes.filter(filter);
	}

	const returnData: INodePropertyOptions[] = [];
	for (const attribute of attributes) {
		returnData.push({
			name: attribute.attribute_code,
			value: attribute.attribute_code,
		});
	}

	// Add additional attributes
	for (const attr of additionalAttributes) {
		returnData.push({
			name: attr,
			value: attr,
		});
	}

	if (extraValue) {
		returnData.unshift(extraValue);
	}
	return returnData.sort(sort);
}
