import {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions, IHttpRequestOptions,
	IWebhookFunctions, type JsonObject, NodeApiError
} from "n8n-workflow";

export async function createApiRequest(this: IExecuteFunctions, data: any, url: string, async: boolean = true, i: number = 0) {
	const qs: IDataObject = {};
	if (async) {
		url = '/async/bulk' + url;
		let dataflowId = this.getNodeParameter('dataflowId', 0, null) as number | null;
		if (!dataflowId) {
			try {
				const inputData = this.getInputData();
				const json = inputData?.[0]?.json as IDataObject | undefined;
				const body = json?.body as IDataObject | undefined;
				const basic = (body?.basic ?? json?.basic ?? json?.data) as IDataObject | undefined;
				if (basic?.type === 'dataflow' && basic?.entity_id) {
					dataflowId = basic.entity_id as number;
				}
			} catch {
				// Input-Daten nicht verfügbar — kein Fehler
			}
		}
		if (dataflowId) {
			qs.dataflowId = dataflowId;
		}
	}
	let responseData = await magentoApiRequest.call(this, 'POST', url, data, qs);
	return this.helpers.constructExecutionMetaData(
		this.helpers.returnJsonArray(responseData as IDataObject[]),
		{itemData: {item: i}},
	);
}

export async function magentoApiRequest(
	this: IWebhookFunctions | IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	resource: string,
	body: any = {},
	qs: IDataObject = {},
	uri?: string,
	_headers: IDataObject = {},
	option: IDataObject = {},
): Promise<any> {
	const credentials = await this.getCredentials('avantaApi');
	const {
		timeout = 10000,
		allowUnauthorizedCerts = false,
		debugMode = false
	} = this.getNodeParameter('request_options', 0, {}) as {
		timeout?: number;
		allowUnauthorizedCerts?: boolean;
		debugMode?: boolean;
	};

	let options: IHttpRequestOptions = {
		method,
		body,
		qs,
		url: uri || `${credentials.host}${resource}`,
		json: true,
		skipSslCertificateValidation: allowUnauthorizedCerts,
		timeout: timeout
	};

	const isLoadOptions = (this.constructor.name === 'LoadOptionsContext') || (this as any).loadOptionsMethod !== undefined;

	try {
		options = Object.assign({}, options, option);
		if (Object.keys(body as IDataObject).length === 0) {
			delete options.body;
		}
		const response = await this.helpers.httpRequestWithAuthentication.call(this, 'avantaApi', options);

		if (debugMode && !isLoadOptions && typeof response === 'object' && response !== null) {
			// Add debug info to response
			return {
				_debug: {
					request: {
						method: options.method,
						url: options.url,
						body: options.body,
						qs: options.qs,
					},
				},
				...response
			};
		}

		return response;
	} catch (error) {
		if (debugMode && !isLoadOptions) {
			const errorResponse = (error && typeof error === 'object') ? JSON.parse(JSON.stringify(error)) : { message: error };
			const debugInfo = { _debug: { request: { method: options.method, url: options.url, body: options.body, qs: options.qs } } };
			
			// Ensure we have a message
			errorResponse.message = errorResponse.message || (error as any).message || 'An error occurred';

			// Format description with debug info
			let description = errorResponse.description;
			try {
				const parsed = (typeof description === 'string') ? JSON.parse(description) : description;
				description = JSON.stringify({ ...debugInfo, ...(typeof parsed === 'object' ? parsed : { original: parsed }) }, null, 2);
			} catch {
				description = JSON.stringify({ ...debugInfo, original: description }, null, 2);
			}
			errorResponse.description = description;
			
			throw new NodeApiError(this.getNode(), errorResponse as JsonObject);
		}
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function magentoApiRequestAllItems(
	this: IHookFunctions | ILoadOptionsFunctions | IExecuteFunctions,
	propertyName: string,
	method: IHttpRequestMethods,
	resource: string,
	body: any = {},
	query: IDataObject = {},
): Promise<any> {
	const returnData: IDataObject[] = [];

	let responseData;

	do {
		responseData = await magentoApiRequest.call(this, method, resource, body, query);
		returnData.push.apply(returnData, responseData[propertyName] as IDataObject[]);
		query.current_page = query.current_page ? (query.current_page as number)++ : 1;
	} while (returnData.length < responseData.total_count);

	return returnData;
}
