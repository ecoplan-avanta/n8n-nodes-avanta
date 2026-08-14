import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties,
    NodeApiError
} from 'n8n-workflow';
import type { JsonObject } from 'n8n-workflow';

import {updateDisplayOptions} from '../../helpers/displayOptions';
import {prepareErrorData} from "../../helpers/utils";
import {createApiRequest} from "../../transport";

const properties: INodeProperties[] = [
    // HEAD -> CONDITIONS
    {
        displayName: 'Currency',
        name: 'currency',
        type: 'string',
        default: '',
        description: 'Optional currency (default from backend)',
        displayOptions: {
            show: {
                resource: ['orderSimulation'],
                operation: ['execute'],
            },
        },
    },
    {
        displayName: 'Head Total',
        name: 'headTotal',
        type: 'number',
        default: 0,
        displayOptions: {
            show: {
                resource: ['orderSimulation'],
                operation: ['execute'],
            },
        },
    },
    {
        displayName: 'Head Tax',
        name: 'headTax',
        type: 'number',
        default: 0,
        displayOptions: {
            show: {
                resource: ['orderSimulation'],
                operation: ['execute'],
            },
        },
    },
    {
        displayName: 'Head Discount',
        name: 'headDiscount',
        type: 'number',
        default: 0,
        displayOptions: {
            show: {
                resource: ['orderSimulation'],
                operation: ['execute'],
            },
        },
    },
    {
        displayName: 'Shipping Costs',
        name: 'shippingCosts',
        type: 'number',
        default: 0,
        displayOptions: {
            show: {
                resource: ['orderSimulation'],
                operation: ['execute'],
            },
        },
    },
    {
        displayName: 'Head Condition Texts Source',
        name: 'headConditionTextsSource',
        type: 'options',
        options: [
            {
                name: 'Define in Node',
                value: 'defineHere',
                description: 'Define condition texts directly in this node',
            },
            {
                name: 'Input Data',
                value: 'inputData',
                description: 'Use data from input',
            },
        ],
        default: 'defineHere',
        displayOptions: {
            show: {
                resource: ['orderSimulation'],
                operation: ['execute'],
            },
        },
    },
    {
        displayName: 'Head Condition Texts',
        name: 'headConditionTexts',
        type: 'fixedCollection',
        typeOptions: {
            multipleValues: true,
        },
        default: [],
        displayOptions: {
            show: {
                resource: ['orderSimulation'],
                operation: ['execute'],
                headConditionTextsSource: ['defineHere'],
            },
        },
        options: [
            {
                name: 'condition',
                displayName: 'Condition',
                values: [
                    {displayName: 'Text', name: 'text', type: 'string', default: ''},
                    {displayName: 'Value', name: 'value', type: 'number', default: 0},
                    {displayName: 'Position', name: 'position', type: 'number', default: 1},
                    {displayName: 'CSS Class', name: 'css_class', type: 'string', default: 'discount'},
                ],
            },
        ],
    },
    {
        displayName: 'Head Condition Texts (Input Field)',
        name: 'headConditionTextsInput',
        type: 'string',
        default: '',
        required: true,
        typeOptions: {
            alwaysOpenEditWindow: true,
            rows: 4,
        },
        displayOptions: {
            show: {
                resource: ['orderSimulation'],
                operation: ['execute'],
                headConditionTextsSource: ['inputData'],
            },
        },
        description: 'The name of the input field containing the condition texts array',
    },
    // HEAD -> SCHEDULE DATA
    {
        displayName: 'Head Notice',
        name: 'headNotice',
        type: 'string',
        default: '',
        displayOptions: {
            show: {
                resource: ['orderSimulation'],
                operation: ['execute'],
            },
        },
    },
    {
        displayName: 'Head Schedule Entries Source',
        name: 'headScheduleDataSource',
        type: 'options',
        options: [
            {
                name: 'Define in Node',
                value: 'defineHere',
                description: 'Define schedule entries directly in this node',
            },
            {
                name: 'Input Data',
                value: 'inputData',
                description: 'Use data from input',
            },
        ],
        default: 'defineHere',
        displayOptions: {
            show: {
                resource: ['orderSimulation'],
                operation: ['execute'],
            },
        },
    },
    {
        displayName: 'Head Schedule Entries',
        name: 'headScheduleData',
        type: 'fixedCollection',
        typeOptions: {multipleValues: true},
        default: [],
        displayOptions: {
            show: {
                resource: ['orderSimulation'],
                operation: ['execute'],
                headScheduleDataSource: ['defineHere'],
            },
        },
        options: [
            {
                name: 'schedule',
                displayName: 'Schedule',
                values: [
                    {displayName: 'Title', name: 'title', type: 'string', default: ''},
                    {displayName: 'Delivery Date', name: 'delivery_date', type: 'string', default: ''},
                    {displayName: 'CSS Class', name: 'css_class', type: 'string', default: 'available'},
                ],
            },
        ],
    },
    {
        displayName: 'Head Schedule Entries (Input Field)',
        name: 'headScheduleDataInput',
        type: 'string',
        default: '',
        required: true,
        typeOptions: {
            alwaysOpenEditWindow: true,
            rows: 4,
        },
        displayOptions: {
            show: {
                resource: ['orderSimulation'],
                operation: ['execute'],
                headScheduleDataSource: ['inputData'],
            },
        },
        description: 'The name of the input field containing the schedule entries array',
    },
    // ITEMS
    {
        displayName: 'Items Source',
        name: 'itemsSource',
        type: 'options',
        options: [
            {
                name: 'Define in Node',
                value: 'defineHere',
                description: 'Define items directly in this node',
            },
            {
                name: 'Input Data',
                value: 'inputData',
                description: 'Use data from input',
            },
        ],
        default: 'defineHere',
        displayOptions: {
            show: {
                resource: ['orderSimulation'],
                operation: ['execute'],
            },
        },
    },
    {
        displayName: 'Items',
        name: 'items',
        type: 'fixedCollection',
        typeOptions: {multipleValues: true},
        default: [],
        displayOptions: {
            show: {
                resource: ['orderSimulation'],
                operation: ['execute'],
                itemsSource: ['defineHere'],
            },
        },
        options: [
            {
                name: 'item',
                displayName: 'Item',
                values: [
													{
														displayName: 'Condition Texts',
														name: 'condition_texts',
														type: 'fixedCollection',
														default: [	],
														options: [
																	{
																		name: 'condition',
																		displayName: 'Condition',
																			values:	[
																			{
																				displayName: 'Text',
																				name: 'text',
																				type: 'string',
																				default: '',
																			},
																			{
																				displayName: 'Value',
																				name: 'value',
																				type: 'number',
																				default: 0
																			},
																			{
																				displayName: 'Position',
																				name: 'position',
																				type: 'number',
																				default: 1
																			},
																			{
																				displayName: 'CSS Class',
																				name: 'css_class',
																				type: 'string',
																				default: 'discount',
																			},
																			]
																	},
															]
													},
													{
														displayName: 'Condition Texts (Input Field)',
														name: 'condition_texts_input',
														type: 'string',
														default: '',
															required:	true,
														description: 'The name of the input field containing the condition texts array',
													},
													{
														displayName: 'Condition Texts Source',
														name: 'condition_texts_source',
														type: 'options',
														options: [
																	{
																		name: 'Define in Node',
																		value: 'defineHere',
																		description: 'Define condition texts directly in this node',
																	},
																	{
																		name: 'Input Data',
																		value: 'inputData',
																		description: 'Use data from input',
																	},
															],
														default: 'defineHere',
													},
													{
														displayName: 'Item Number',
														name: 'item_number',
														type: 'number',
														default: 0
													},
													{
														displayName: 'Quantity',
														name: 'qty',
														type: 'number',
														default: 1
													},
													{
														displayName: 'Schedule Data',
														name: 'schedule_data',
														type: 'fixedCollection',
														default: [],
														options: [
																	{
																		name: 'schedule',
																		displayName: 'Schedule',
																			values:	[
																			{
																				displayName: 'Quantity',
																				name: 'qty',
																				type: 'number',
																				default: 0
																			},
																			{
																				displayName: 'Unit',
																				name: 'unit',
																				type: 'string',
																				default: 'ST',
																			},
																			{
																				displayName: 'Delivery Date',
																				name: 'delivery_date',
																				type: 'string',
																				default: '',
																			},
																			{
																				displayName: 'CSS Class',
																				name: 'css_class',
																				type: 'string',
																				default: 'available',
																			},
																			]
																	},
															]
													},
													{
														displayName: 'Schedule Data (Input Field)',
														name: 'schedule_data_input',
														type: 'string',
														default: '',
															required:	true,
														description: 'The name of the input field containing the schedule data array',
													},
													{
														displayName: 'Schedule Data Source',
														name: 'schedule_data_source',
														type: 'options',
														options: [
																	{
																		name: 'Define in Node',
																		value: 'defineHere',
																		description: 'Define schedule data directly in this node',
																	},
																	{
																		name: 'Input Data',
																		value: 'inputData',
																		description: 'Use data from input',
																	},
															],
														default: 'defineHere',
													},
													{
														displayName: 'SKU',
														name: 'sku',
														type: 'string',
														default: '',
													},
													{
														displayName: 'Tax',
														name: 'tax',
														type: 'number',
														default: 0
													},
													{
														displayName: 'Total Price',
														name: 'total',
														type: 'number',
														default: 0
													},
													],
            },
        ],
    },
    {
        displayName: 'Items (Input Field)',
        name: 'itemsInput',
        type: 'string',
        default: '',
        required: true,
        typeOptions: {
            alwaysOpenEditWindow: true,
            rows: 4,
        },
        displayOptions: {
            show: {
                resource: ['orderSimulation'],
                operation: ['execute'],
                itemsSource: ['inputData'],
            },
        },
        description: 'The name of the input field containing the items array',
    },
];

const displayOptions = {
    show: {
        resource: ['orderSimulation'],
        operation: ['execute'],
    },
};

export const description = updateDisplayOptions(displayOptions, properties);

const restUrl = '/V1/proline-admin/order/simulation';

export async function execute(
    this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
        try {
            // Get basic parameters
            const currency = this.getNodeParameter('currency', i, '') as string;
            const headTotal = this.getNodeParameter('headTotal', i, 0) as number;
            const headTax = this.getNodeParameter('headTax', i, 0) as number;
            const headDiscount = this.getNodeParameter('headDiscount', i, 0) as number;
            const shippingCosts = this.getNodeParameter('shippingCosts', i, 0) as number;
            const headNotice = this.getNodeParameter('headNotice', i, '') as string;

            // Get head condition texts based on source
            let headConditionTextsArray: any[] = [];
            const headConditionTextsSource = this.getNodeParameter('headConditionTextsSource', i) as string;
            if (headConditionTextsSource === 'defineHere') {
                const headConditionTexts = this.getNodeParameter('headConditionTexts', i, { condition: [] }) as { condition: any[] };
                headConditionTextsArray = headConditionTexts.condition.map(condition => ({
                    text: condition.text,
                    value: condition.value,
                    position: condition.position,
                    css_class: condition.css_class
                }));
            } else {
                const headConditionTextsInput = this.getNodeParameter('headConditionTextsInput', i) as string;
                if (headConditionTextsInput && items[i].json[headConditionTextsInput]) {
                    const inputData = items[i].json[headConditionTextsInput];
                    headConditionTextsArray = Array.isArray(inputData) ? inputData : [];
                }
            }

            // Get head schedule data based on source
            let headScheduleDataArray: any[] = [];
            const headScheduleDataSource = this.getNodeParameter('headScheduleDataSource', i) as string;
            if (headScheduleDataSource === 'defineHere') {
                const headScheduleData = this.getNodeParameter('headScheduleData', i, { schedule: [] }) as { schedule: any[] };
                headScheduleDataArray = headScheduleData.schedule.map(schedule => ({
                    title: schedule.title,
                    delivery_date: schedule.delivery_date,
                    css_class: schedule.css_class
                }));
            } else {
                const headScheduleDataInput = this.getNodeParameter('headScheduleDataInput', i) as string;
                if (headScheduleDataInput && items[i].json[headScheduleDataInput]) {
                    const inputData = items[i].json[headScheduleDataInput];
                    headScheduleDataArray = Array.isArray(inputData) ? inputData : [];
                }
            }

            // Get items based on source
            let itemsArray: any[] = [];
            const itemsSource = this.getNodeParameter('itemsSource', i) as string;
            if (itemsSource === 'defineHere') {
                const itemsData = this.getNodeParameter('items', i, { item: [] }) as { item: any[] };

                itemsArray = itemsData.item.map(item => {
                    // Get condition texts for this item based on source
                    let itemConditionTexts: any[] = [];
                    if (item.condition_texts_source === 'defineHere') {
                        itemConditionTexts = item.condition_texts?.condition?.map((condition: any) => ({
                            text: condition.text,
                            value: condition.value,
                            position: condition.position,
                            css_class: condition.css_class
                        })) || [];
                    } else if (item.condition_texts_input && items[i].json[item.condition_texts_input]) {
                        const inputData = items[i].json[item.condition_texts_input];
                        itemConditionTexts = Array.isArray(inputData) ? inputData : [];
                    }

                    // Get schedule data for this item based on source
                    let itemScheduleData: any[] = [];
                    if (item.schedule_data_source === 'defineHere') {
                        itemScheduleData = item.schedule_data?.schedule?.map((schedule: any) => ({
                            qty: schedule.qty,
                            unit: schedule.unit,
                            delivery_date: schedule.delivery_date,
                            css_class: schedule.css_class
                        })) || [];
                    } else if (item.schedule_data_input && items[i].json[item.schedule_data_input]) {
                        const inputData = items[i].json[item.schedule_data_input];
                        itemScheduleData = Array.isArray(inputData) ? inputData : [];
                    }

                    return {
                        item_number: item.item_number,
                        sku: item.sku,
                        conditions: {
                            total: item.total,
                            tax: item.tax,
                            qty: item.qty,
                            condition_texts: itemConditionTexts
                        },
                        schedule_data: itemScheduleData
                    };
                });
            } else {
                const itemsInput = this.getNodeParameter('itemsInput', i) as string;
                if (itemsInput && items[i].json[itemsInput]) {
                    const inputData = items[i].json[itemsInput];
                    itemsArray = Array.isArray(inputData) ? inputData : [];
                }
            }

            // Build request data
            const requestData = {
                basic: {
                    status_code: 200,
                    request: {},
                    response: {},
                    time: 2
                },
                response_data: {
                    head: {
                        conditions: {
                            total: headTotal,
                            tax: headTax,
                            discount: headDiscount,
                            shipping_costs: shippingCosts,
                            currency: currency,
                            condition_texts: headConditionTextsArray
                        },
                        schedule_data: {
                            notice: headNotice,
                            schedule_data: headScheduleDataArray
                        }
                    },
                    items: itemsArray
                }
            };

            // Make API request
            const executionData = await createApiRequest.call(this, requestData, restUrl, false, i);
            returnData.push(...executionData);
        } catch (error) {
            if (this.continueOnFail()) {
                returnData.push(...prepareErrorData.call(this, error, i));
                continue;
            }

            throw new NodeApiError(this.getNode(), error as JsonObject);
        }
    }

    return returnData;
}
