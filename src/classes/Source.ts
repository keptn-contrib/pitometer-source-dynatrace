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

  async fetch(query): Promise<number | boolean> {
    const params: any = {};
    // Only timeseries for now
    if (!query.timeseriesId) return false;
    const percentile = /p(\d+)/;
    const percentileMatch = query.aggregation.match(percentile);
    if (percentileMatch) {
      params.aggregationType = 'percentile';
      params.percentile = percentileMatch[1];
    } else {
      params.aggregationType = query.aggregation;
    }
    params.relativeTime = 'day';
    params.entities = query.entityIds;
    params.tags = query.tags;
    params.queryMode = 'TOTAL';
    const timeseries = await this.dynatraceApi.timeseries(query.timeseriesId, params);

    const values = Object.values(timeseries.spec.dataPoints);
    if (!values.length) return false;
    return values[0][0][1];
  }
}
