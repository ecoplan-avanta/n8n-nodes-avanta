import type {INodeProperties} from 'n8n-workflow';

import * as create from './create.operation';
import * as getAll from './getAll.operation';
import * as remove from './remove.operation';
import * as linkCompany from './link-contact-to-companies.operation';
import * as linkSalesorg from './link-contact-to-companies.operation';

export {create, getAll, remove, linkCompany, linkSalesorg};

export const description: INodeProperties[] = [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['companyContact'],
            },
        },
        options: [
            {
                name: 'Create',
                value: 'create',
                description: 'Create a contact',
                action: 'Create a contact',
            },
            {
                name: 'Delete',
                value: 'remove',
                description: 'Delete contacts',
                action: 'Delete contacts',
            },
            {
                name: 'Get many',
                value: 'getAll',
                description: 'Get many company contacts',
                action: 'Get many company contacts'
            },
            {
                name: 'Link to company',
                value: 'linkCompany',
                description: 'Establish link between contact person and companies by external id',
                action: 'Link to company'
            },
            {
                name: 'Link to sales org',
                value: 'linkSalesorg',
                description: 'Establish link between contact person and sales org by external id',
                action: 'Link to sales org'
            }
        ],
        default: 'create',
    },
    ...create.description,
    ...getAll.description,
    ...remove.description,
    ...linkCompany.description,
    ...linkSalesorg.description
];
