/*
 * Copyright (c) 2026 by ECOPLAN E-Commerce GmbH
 *
 * Diese Software ist urheberrechtlich geschützt.
 * Es ist verboten, den Quelltext zu entschlüsseln oder zu verändern,
 * sowie die Software mehr als lizenziert zu nutzen.
 * Zuwiderhandlungen werden strafrechtlich verfolgt.
 */

import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeProperties
} from 'n8n-workflow';

import {updateDisplayOptions} from '../../../helpers/displayOptions';
import {getSearchFilters, executeGetAll} from "../../../helpers/utils";

const properties: INodeProperties[] = [
    ...getSearchFilters('tickets'),
];

const displayOptions = {
    show: {
        resource: ['tickets'],
        operation: ['getAll'],
    },
};

const restUrl = '/V1/avanta-admin/offer/ticket';

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(
    this: IExecuteFunctions
): Promise<INodeExecutionData[]> {
    return executeGetAll.call(this, restUrl);
}
