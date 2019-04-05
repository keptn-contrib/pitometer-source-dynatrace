/**
 * Copyright 2019, Dynatrace
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as pitometer from 'pitometer';
import { Dynatrace, IDynatraceOptions } from '@dynatrace/api-client';

export class Source implements pitometer.ISource {

  private dynatraceApi;

  constructor(config: IDynatraceOptions) {
    this.dynatraceApi = new Dynatrace(config);
  }

  async queryTimeseries(query): Promise<number | boolean> {
    const params = this.getParams(query);

    params.queryMode = 'TOTAL';
    const timeseries = await this.dynatraceApi.timeseries(query.timeseriesId, params);

    const values = Object.values(timeseries.spec.dataPoints);
    if (!values.length) return false;
    return values[0][0][1];
  }
  async querySmartscape(query): Promise<number | boolean> {
    const params = this.getParams(query);

    let entities: any = [];

    if (query.entityType === 'Service') {
      entities = await this.dynatraceApi.services(params);
    } else if (query.entityType === 'Application') {
      entities = await this.dynatraceApi.applications(params);
    } else if (query.entityType === 'Process') {
      entities = await this.dynatraceApi.processes(params);
    }

    // console.log(entities[0].spec);

    return false;
  }

  private getParams(query): any {
    const params: any = {};
    const percentile = /p(\d+)/;
    const percentileMatch = query.aggregation.match(percentile);
    if (percentileMatch) {
      params.aggregationType = 'percentile';
      params.percentile = percentileMatch[1];
    } else {
      params.aggregationType = query.aggregation;
    }

    if (query.relativeTime) {
      params.relativeTime = query.relativeTime;
    } else if (query.startTimestamp && query.endTimestamp) {
      params.startTimestamp = query.startTimestamp;
      params.endTimestamp = query.endTimestamp;
    } else {
      params.relativeTime = 'day';
    }

    params.entities = query.entityIds;
    params.tags = query.tags;
    return params;
  }

  async fetch(query): Promise<number | boolean> {
    if (query.timeseriesId) {
      return this.queryTimeseries(query);
    }

    if (query.smartscape) {
      return this.querySmartscape(query);
    }

    return false;
  }
}
