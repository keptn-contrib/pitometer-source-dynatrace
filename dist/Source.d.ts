import * as pitometer from 'pitometer';
import { IDynatraceOptions } from '@dynatrace/api-client';
export declare class Source implements pitometer.ISource {
    private dynatraceApi;
    constructor(config: IDynatraceOptions);
    fetch(query: any): Promise<number | boolean>;
}
