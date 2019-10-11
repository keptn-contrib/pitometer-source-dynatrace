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

import * as pitometer from '@keptn/pitometer';
import { Dynatrace, IDynatraceOptions } from '@dynatrace/api-client';
import { ENOENT } from 'constants';

export class Source implements pitometer.ISource {

  private dynatraceApi;
  private timeStart: number;
  private timeEnd: number;
  private context: string;

  constructor(config: IDynatraceOptions) {
    this.dynatraceApi = new Dynatrace(config);
  }

  public setOptions(options: pitometer.IOptions) {
    this.timeStart = options.timeStart;
    this.timeEnd = options.timeEnd;
    this.context = options.context;
  }

  async queryTimeseries(query): Promise<pitometer.ISourceResult[]> {
    const params = this.getParams(query);

    params.queryMode = 'TOTAL';
    const timeseries = await this.dynatraceApi.timeseries(query.timeseriesId, params);
    const values = Object.values(timeseries.spec.dataPoints);
    if (!values.length) {
      const result: pitometer.ISourceResult[] = [];
      return result;
    }

    const clean = Object.keys(timeseries.spec.dataPoints).map((key) => {
      const entry = timeseries.spec.dataPoints[key];
      const value = entry[0];

      return {
        key,
        timestamp: value[0],
        value: value[1],
      };
    });

    return clean;
  }

  async querySmartscape(query): Promise<pitometer.ISourceResult[]> {
    const params = this.getParams(query);

    let entities: any = [];

    if (query.entityType === 'Service') {
      entities = await this.dynatraceApi.services(params);
    } else if (query.entityType === 'Application') {
      entities = await this.dynatraceApi.applications(params);
    } else if (query.entityType === 'Process') {
      entities = await this.dynatraceApi.processes(params);
    }

    const result = entities.map((entity) => {
      const key = entity.spec.entityId;
      const timestamp = entity.spec.lastSeenTimestamp;
      const querypart = query.smartscape.split(':');
      const relation = querypart[0];
      const metric = querypart[1];

      if (query.aggregation === 'count') {
        const value = entity[relation] && entity[relation][metric] ?
          entity[relation][metric].length : 0;
        return {
          key,
          timestamp,
          value,
        };
      }
      throw new Error(`Unsupported aggregation for smartscape: ${query.aggregation}`);
    });
    return result;
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

    params.startTimestamp = this.timeStart * 1000;
    params.endTimestamp = this.timeEnd * 1000;

    params.entities = query.entityIds;
    params.tags = query.tags;
    return params;
  }

  async fetch(query): Promise<pitometer.ISourceResult[]> {
    if (query.timeseriesId) {
      return this.queryTimeseries(query);
    }

    if (query.smartscape) {
      return this.querySmartscape(query);
    }

    throw new Error('Unsupported query type');
  }
}
