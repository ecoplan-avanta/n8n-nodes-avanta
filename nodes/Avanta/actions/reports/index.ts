import type {INodeProperties} from 'n8n-workflow';

import * as backorders from './backorders';
import * as creditmemos from './creditmemos';
import * as invoices from './invoices';
import * as orders from './orders';
import * as reshipments from './reshipments';
import * as shipments from './shipments';
import * as trackings from './trackings';
import * as tickets from './tickets';
import * as inquiries from './inquiries';
import * as returns from './returns';

export const description: INodeProperties[] = [
    ...backorders.description,
    ...creditmemos.description,
    ...invoices.description,
    ...orders.description,
    ...reshipments.description,
    ...shipments.description,
    ...trackings.description,
    ...tickets.description,
    ...inquiries.description,
    ...returns.description
];
