import {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions, IRequestOptions,
	IWebhookFunctions, type JsonObject, NodeApiError
} from "n8n-workflow";

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
	const credentials = await this.getCredentials('magento2Api');

	let options: IRequestOptions = {
		method,
		body,
		qs,
		uri: uri || `${credentials.host}${resource}`,
		json: true,
		rejectUnauthorized: false,
	};

	try {
		options = Object.assign({}, options, option);
		if (Object.keys(body as IDataObject).length === 0) {
			delete options.body;
		}
		console.log(options);
		return await this.helpers.requestWithAuthentication.call(this, 'magento2Api', options);
	} catch (error) {
		console.log(error);
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
		console.log(returnData.length);
		console.log(responseData.total_count);
	} while (returnData.length < responseData.total_count);

	console.log(returnData);
	return returnData;
}
