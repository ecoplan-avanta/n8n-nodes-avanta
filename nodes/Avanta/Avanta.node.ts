import {capitalCase} from 'change-case';
import type {
	IExecuteFunctions,
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	ResourceMapperFields,
	ResourceMapperField
} from 'n8n-workflow';
import {
	NodeConnectionType,
	NodeApiError,
	NodeOperationError,
	WEBHOOK_NODE_TYPE,
	FORM_TRIGGER_NODE_TYPE,
	CHAT_TRIGGER_NODE_TYPE,
	WAIT_NODE_TYPE
} from 'n8n-workflow';

import {customerFields, customerOperations} from './CustomerDescription';
import {
	adjustAddresses,
	getFilterQuery,
	getOrderFields,
	getProductAttributes,
	magentoApiRequest,
	magentoApiRequestAllItems,
	sort,
	validateJSON,
} from './GenericFunctions';
import {productFields, productOperations} from './ProductDescription';
import type {
	CustomAttribute,
	CustomerAttributeMetadata,
	Filter,
	NewCustomer,
	NewProduct,
	Search,
	Company
} from './types';
import {companyOperations, companyFields} from "./CompanyDescription";

export class Avanta implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Avanta',
		name: 'avanta',
		icon: 'file:avanta.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume Avanta API',
		defaults: {
			name: 'Avanta',
		},
		usableAsTool: true,
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'magento2Api',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Company',
						value: 'company',
					},
					{
						name: 'Customer',
						value: 'customer',
					},
					{
						name: 'Product',
						value: 'product',
					},
				],
				default: 'company',
			},
			...customerOperations,
			...customerFields,
			...companyOperations,
			...companyFields,
			...productOperations,
			...productFields,
		],
	};

	methods = {
		loadOptions: {
			// Funktion zum Abrufen der dynamischen Feld-Optionen für das UI
			async getDynamicFieldOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
			},
			async getCountries(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				//https://magento.redoc.ly/2.3.7-admin/tag/directorycountries
				const countries = await magentoApiRequest.call(
					this,
					'GET',
					'/rest/default/V1/directory/countries',
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
			},
			async getGroups(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				//https://magento.redoc.ly/2.3.7-admin/tag/customerGroupsdefault#operation/customerGroupManagementV1GetDefaultGroupGet
				const group = await magentoApiRequest.call(
					this,
					'GET',
					'/rest/default/V1/customerGroups/default',
				);
				const returnData: INodePropertyOptions[] = [];
				returnData.push({
					name: group.code,
					value: group.id,
				});
				returnData.sort(sort);
				return returnData;
			},
			async getStores(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				//https://magento.redoc.ly/2.3.7-admin/tag/storestoreConfigs
				const stores = await magentoApiRequest.call(
					this,
					'GET',
					'/rest/default/V1/store/storeConfigs',
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
			},
			async getWebsites(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				//https://magento.redoc.ly/2.3.7-admin/tag/storewebsites
				const websites = await magentoApiRequest.call(
					this,
					'GET',
					'/rest/default/V1/store/websites',
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
			},
			async getCustomAttributes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				//https://magento.redoc.ly/2.3.7-admin/tag/attributeMetadatacustomer#operation/customerCustomerMetadataV1GetAllAttributesMetadataGet
				const resource = this.getCurrentNodeParameter('resource') as string;
				const attributes = (await magentoApiRequest.call(
					this,
					'GET',
					`/rest/default/V1/attributeMetadata/${resource}`,
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
			},
			async getSystemAttributes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				//https://magento.redoc.ly/2.3.7-admin/tag/attributeMetadatacustomer#operation/customerCustomerMetadataV1GetAllAttributesMetadataGet
				const resource = this.getCurrentNodeParameter('resource') as string;
				const attributes = (await magentoApiRequest.call(
					this,
					'GET',
					`/rest/default/V1/attributeMetadata/${resource}`,
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
			},
			async getProductTypes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				//https://magento.redoc.ly/2.3.7-admin/tag/productslinkstypes
				const types = (await magentoApiRequest.call(
					this,
					'GET',
					'/rest/default/V1/products/types',
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
			},
			async getCategories(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				//https://magento.redoc.ly/2.3.7-admin/tag/categories#operation/catalogCategoryManagementV1GetTreeGet
				const {items: categories} = (await magentoApiRequest.call(
					this,
					'GET',
					'/rest/default/V1/categories/list',
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
			},
			async getAttributeSets(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				//https://magento.redoc.ly/2.3.7-admin/tag/productsattribute-setssetslist#operation/catalogAttributeSetRepositoryV1GetListGet
				const {items: attributeSets} = (await magentoApiRequest.call(
					this,
					'GET',
					'/rest/default/V1/products/attribute-sets/sets/list',
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
			},
			async getFilterableCustomerAttributes(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				return await getProductAttributes.call(this, (attribute) => attribute.is_filterable);
			},
			async getProductAttributes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return await getProductAttributes.call(this);
			},
			// async getProductAttributesFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
			// 	return getProductAttributes.call(this, undefined, { name: '*', value: '*', description: 'All properties' });
			// },
			async getFilterableProductAttributes(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				return await getProductAttributes.call(
					this,
					(attribute) => attribute.is_searchable === '1',
				);
			},
			async getSortableProductAttributes(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				return await getProductAttributes.call(this, (attribute) => attribute.used_for_sort_by);
			},
			async getOrderAttributes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return getOrderFields()
					.map((field) => ({name: capitalCase(field), value: field}))
					.sort(sort);
			},
		},
		resourceMapping: {
			async getDynamicFieldOptions(this: ILoadOptionsFunctions): Promise<ResourceMapperFields> {
				try {
					const body = {
						interfaceName: 'Ecoplan\\Proline\\Api\\Data\\CompanyInterface',
					};
					const response = await magentoApiRequest.call(this, 'POST', 'all/V1/proline/connector/interfaceMetaData', body);
					console.log('response');
					const fields: ResourceMapperField[] = response;
					console.log({fields});
					return {fields};
				} catch (error) {
					console.error('Error fetching dynamic field options:', error.message);
				}
			}
		}
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		let errorLog: any[] = [];

		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		let responseData;
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		const companies = [];
		for (let i = 0; i < length; i++) {
			try {
				let item = items[i];
				if (item.json?.error) { // Prüft, ob das Objekt einen Fehler enthält
					errorLog.push({
						json: {
							node: `Input ${index + 1}`,
							errorMessage: item.json.error, // Die tatsächliche Fehlermeldung
							itemIndex: item.pairedItem?.item ?? "Unbekannt", // Falls vorhanden, Item-Index speichern
							inputSource: item.pairedItem?.input ?? "Unbekannt",
							timestamp: new Date().toISOString(),
						},
					});
				}
				if (resource === 'company') {
					if (operation === 'create') {
						let fields = this.getNodeParameter('fields', i);
						if (fields) {
							let company = {
								'company': {}
							}
							company.company = fields.value

							if (!('group_id' in company.company) || !company.company.group_id) {
								company.company.group_id = 1
							}

							if (!('company_role_id' in company.company) || !company.company.company_role_id) {
								company.company.company_role_id = 1
							}

							// Erstelle das extension_attributes-Objekt
							company.company.extension_attributes = {};

// Gehe durch alle Eigenschaften von company.company
							for (let key in company.company) {
								if (company.company.hasOwnProperty(key)) {
									// Prüfe, ob der Schlüssel mit 'extension_attribute' beginnt
									if (key.startsWith('extension_attribute')) {
										co
										// Entferne 'extension_attribute' aus dem Schlüssel
										const newKey = key.replace('extension_attribute', '');

										// Verschiebe die Eigenschaft in 'extension_attributes' mit dem neuen Schlüssel
										company.company.extension_attributes[newKey] = company.company[key];

										// Lösche die Eigenschaft von company.company
										delete company.company[key];
									}
								}
							}
							console.log(company);


							companies.push(company);
						}
					}
				}
				if (resource === 'customer') {
					if (operation === 'create') {
						// https://magento.redoc.ly/2.3.7-admin/tag/customerscustomerId#operation/customerCustomerRepositoryV1SavePut
						const email = this.getNodeParameter('email', i) as string;
						const firstname = this.getNodeParameter('firstname', i) as string;
						const lastname = this.getNodeParameter('lastname', i) as string;

						const {addresses, customAttributes, password, ...rest} = this.getNodeParameter(
							'additionalFields',
							i,
						) as {
							addresses: {
								address: [
									{
										street: string;
									},
								];
							};
							customAttributes: {
								customAttribute: CustomAttribute[];
							};
							password: string;
						};

						const body: NewCustomer = {
							customer: {
								email,
								firstname,
								lastname,
							},
						};

						body.customer!.addresses = adjustAddresses(addresses?.address || []);

						body.customer!.custom_attributes = customAttributes?.customAttribute || {};

						body.customer!.extension_attributes = [
							'amazon_id',
							'is_subscribed',
							'vertex_customer_code',
							'vertex_customer_country',
						].reduce((obj, value: string): any => {
							if ((rest as IDataObject).hasOwnProperty(value)) {
								const data = Object.assign(obj, {[value]: (rest as IDataObject)[value]});
								delete (rest as IDataObject)[value];
								return data;
							} else {
								return obj;
							}
						}, {});

						if (password) {
							body.password = password;
						}

						Object.assign(body.customer!, rest);

						responseData = await magentoApiRequest.call(this, 'POST', '/rest/V1/customers', body);
					}

					if (operation === 'delete') {
						//https://magento.redoc.ly/2.3.7-admin/tag/customerscustomerId#operation/customerCustomerRepositoryV1SavePut
						const customerId = this.getNodeParameter('customerId', i) as string;

						responseData = await magentoApiRequest.call(
							this,
							'DELETE',
							`/rest/default/V1/customers/${customerId}`,
						);

						responseData = {success: true};
					}

					if (operation === 'get') {
						//https://magento.redoc.ly/2.3.7-admin/tag/customerscustomerId#operation/customerCustomerRepositoryV1GetByIdGet
						const customerId = this.getNodeParameter('customerId', i) as string;

						responseData = await magentoApiRequest.call(
							this,
							'GET',
							`/rest/default/V1/customers/${customerId}`,
						);
					}

					if (operation === 'getAll') {
						//https://magento.redoc.ly/2.3.7-admin/tag/customerssearch
						const filterType = this.getNodeParameter('filterType', i) as string;
						const sortOption = this.getNodeParameter('options.sort', i, {}) as {
							sort: [{ direction: string; field: string }];
						};
						const returnAll = this.getNodeParameter('returnAll', 0);
						let qs: Search = {};

						if (filterType === 'manual') {
							const filters = this.getNodeParameter('filters', i) as { conditions: Filter[] };
							const matchType = this.getNodeParameter('matchType', i) as string;
							qs = getFilterQuery(Object.assign(filters, {matchType}, sortOption));
						} else if (filterType === 'json') {
							const filterJson = this.getNodeParameter('filterJson', i) as string;
							if (validateJSON(filterJson) !== undefined) {
								qs = JSON.parse(filterJson);
							} else {
								throw new NodeApiError(this.getNode(), {
									message: 'Filter (JSON) must be a valid json',
								});
							}
						} else {
							qs = {
								search_criteria: {},
							};

							if (Object.keys(sortOption).length !== 0) {
								qs.search_criteria = {
									sort_orders: sortOption.sort,
								};
							}
						}

						if (returnAll) {
							qs.search_criteria!.page_size = 100;
							responseData = await magentoApiRequestAllItems.call(
								this,
								'items',
								'GET',
								'/rest/default/V1/customers/search',
								{},
								qs as unknown as IDataObject,
							);
						} else {
							const limit = this.getNodeParameter('limit', 0);
							qs.search_criteria!.page_size = limit;
							responseData = await magentoApiRequest.call(
								this,
								'GET',
								'/rest/default/V1/customers/search',
								{},
								qs as unknown as IDataObject,
							);
							responseData = responseData.items;
						}
					}

					if (operation === 'update') {
						//https://magento.redoc.ly/2.3.7-admin/tag/customerscustomerId#operation/customerCustomerRepositoryV1SavePut
						const customerId = this.getNodeParameter('customerId', i) as string;
						const firstName = this.getNodeParameter('firstName', i) as string;
						const lastName = this.getNodeParameter('lastName', i) as string;
						const email = this.getNodeParameter('email', i) as string;

						const {addresses, customAttributes, password, ...rest} = this.getNodeParameter(
							'updateFields',
							i,
						) as {
							addresses: {
								address: [
									{
										street: string;
									},
								];
							};
							customAttributes: {
								customAttribute: CustomAttribute[];
							};
							password: string;
						};

						const body: NewCustomer = {
							customer: {
								email,
								firstname: firstName,
								lastname: lastName,
								id: parseInt(customerId, 10),
								website_id: 0,
							},
						};

						body.customer!.addresses = adjustAddresses(addresses?.address || []);

						body.customer!.custom_attributes = customAttributes?.customAttribute || {};

						body.customer!.extension_attributes = [
							'amazon_id',
							'is_subscribed',
							'vertex_customer_code',
							'vertex_customer_country',
						].reduce((obj, value: string): any => {
							if ((rest as IDataObject).hasOwnProperty(value)) {
								const data = Object.assign(obj, {[value]: (rest as IDataObject)[value]});
								delete (rest as IDataObject)[value];
								return data;
							} else {
								return obj;
							}
						}, {});

						if (password) {
							body.password = password;
						}

						Object.assign(body.customer!, rest);

						responseData = await magentoApiRequest.call(
							this,
							'PUT',
							`/rest/V1/customers/${customerId}`,
							body,
						);
					}
				}

				if (resource === 'product') {
					if (operation === 'create') {
						// https://magento.redoc.ly/2.3.7-admin/tag/products#operation/catalogProductRepositoryV1SavePost
						const sku = this.getNodeParameter('sku', i) as string;
						const name = this.getNodeParameter('name', i) as string;
						const attributeSetId = this.getNodeParameter('attributeSetId', i) as string;
						const price = this.getNodeParameter('price', i) as number;

						const {
							customAttributes,
							category: _category,
							...rest
						} = this.getNodeParameter('additionalFields', i) as {
							customAttributes: {
								customAttribute: CustomAttribute[];
							};
							category: string;
						};

						const body: NewProduct = {
							product: {
								sku,
								name,
								attribute_set_id: parseInt(attributeSetId, 10),
								price,
							},
						};

						body.product!.custom_attributes = customAttributes?.customAttribute || {};

						Object.assign(body.product!, rest);

						responseData = await magentoApiRequest.call(
							this,
							'POST',
							'/rest/default/V1/products',
							body,
						);
					}

					if (operation === 'delete') {
						//https://magento.redoc.ly/2.3.7-admin/tag/productssku#operation/catalogProductRepositoryV1DeleteByIdDelete
						const sku = this.getNodeParameter('sku', i) as string;

						responseData = await magentoApiRequest.call(
							this,
							'DELETE',
							`/rest/default/V1/products/${sku}`,
						);

						responseData = {success: true};
					}

					if (operation === 'get') {
						//https://magento.redoc.ly/2.3.7-admin/tag/productssku#operation/catalogProductRepositoryV1GetGet
						const sku = this.getNodeParameter('sku', i) as string;

						responseData = await magentoApiRequest.call(
							this,
							'GET',
							`/rest/default/V1/products/${sku}`,
						);
					}

					if (operation === 'getAll') {
						//https://magento.redoc.ly/2.3.7-admin/tag/customerssearch
						const filterType = this.getNodeParameter('filterType', i) as string;
						const sortOption = this.getNodeParameter('options.sort', i, {}) as {
							sort: [{ direction: string; field: string }];
						};
						const returnAll = this.getNodeParameter('returnAll', 0);
						let qs: Search = {};

						if (filterType === 'manual') {
							const filters = this.getNodeParameter('filters', i) as { conditions: Filter[] };
							const matchType = this.getNodeParameter('matchType', i) as string;
							qs = getFilterQuery(Object.assign(filters, {matchType}, sortOption));
						} else if (filterType === 'json') {
							const filterJson = this.getNodeParameter('filterJson', i) as string;
							if (validateJSON(filterJson) !== undefined) {
								qs = JSON.parse(filterJson);
							} else {
								throw new NodeApiError(this.getNode(), {
									message: 'Filter (JSON) must be a valid json',
								});
							}
						} else {
							qs = {
								search_criteria: {},
							};
							if (Object.keys(sortOption).length !== 0) {
								qs.search_criteria = {
									sort_orders: sortOption.sort,
								};
							}
						}

						if (returnAll) {
							qs.search_criteria!.page_size = 100;
							responseData = await magentoApiRequestAllItems.call(
								this,
								'items',
								'GET',
								'/rest/default/V1/products',
								{},
								qs as unknown as IDataObject,
							);
						} else {
							const limit = this.getNodeParameter('limit', 0);
							qs.search_criteria!.page_size = limit;
							responseData = await magentoApiRequest.call(
								this,
								'GET',
								'/rest/default/V1/products',
								{},
								qs as unknown as IDataObject,
							);
							responseData = responseData.items;
						}
					}

					if (operation === 'update') {
						//https://magento.redoc.ly/2.3.7-admin/tag/productssku#operation/catalogProductRepositoryV1SavePut
						const sku = this.getNodeParameter('sku', i) as string;

						const {customAttributes, ...rest} = this.getNodeParameter('updateFields', i) as {
							customAttributes: {
								customAttribute: CustomAttribute[];
							};
						};

						if (!Object.keys(rest).length) {
							throw new NodeApiError(this.getNode(), {
								message: 'At least one parameter has to be updated',
							});
						}

						const body: NewProduct = {
							product: {
								sku,
							},
						};

						body.product!.custom_attributes = customAttributes?.customAttribute || {};

						Object.assign(body.product!, rest);

						responseData = await magentoApiRequest.call(
							this,
							'PUT',
							`/rest/default/V1/products/${sku}`,
							body,
						);
					}
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as IDataObject[]),
					{itemData: {item: i}},
				);

				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({error: error.message}),
						{itemData: {item: i}},
					);
					returnData.push(...executionErrorData);
					continue;
				}
				throw error;
			}
		}
		try {

			console.log(errorLog)
			console.log(companies);
			console.log('test');
			responseData = await magentoApiRequest.call(this, 'POST', '/async/bulk/V1/proline-admin/company', companies);
			console.log(responseData);
			const executionData = this.helpers.constructExecutionMetaData(
				this.helpers.returnJsonArray(responseData as IDataObject[]),
				{itemData: {item: 1}},
			);

			const nodeVersion = this.getNode().typeVersion;

			const WEBHOOK_NODE_TYPES = [
				WEBHOOK_NODE_TYPE,
				FORM_TRIGGER_NODE_TYPE,
				CHAT_TRIGGER_NODE_TYPE,
				WAIT_NODE_TYPE,
			];
			if (nodeVersion >= 1.1) {
				const connectedNodes = this.getParentNodes(this.getNode().name);
				if (!connectedNodes.some(({type}) => WEBHOOK_NODE_TYPES.includes(type))) {
					throw new NodeOperationError(
						this.getNode(),
						new Error('No Webhook node found in the workflow'),
						{
							description:
								'Insert a Webhook node to your workflow and set the “Respond” parameter to “Using Respond to Webhook Node” ',
						},
					);
				}
			}

			returnData.push(...executionData);
		} catch (error) {
			console.log(error);
			throw error;
		}

		return [responseData];
	}
}
