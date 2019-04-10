"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_client_1 = require("@dynatrace/api-client");
class Source {
    constructor(config) {
        this.dynatraceApi = new api_client_1.Dynatrace(config);
    }
    setOptions(options) {
        this.timeStart = options.timeStart;
        this.timeEnd = options.timeEnd;
        this.context = options.context;
    }
    queryTimeseries(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = this.getParams(query);
            params.queryMode = 'TOTAL';
            const timeseries = yield this.dynatraceApi.timeseries(query.timeseriesId, params);
            const values = Object.values(timeseries.spec.dataPoints);
            if (!values.length)
                return false;
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
        });
    }
    querySmartscape(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = this.getParams(query);
            let entities = [];
            if (query.entityType === 'Service') {
                entities = yield this.dynatraceApi.services(params);
            }
            else if (query.entityType === 'Application') {
                entities = yield this.dynatraceApi.applications(params);
            }
            else if (query.entityType === 'Process') {
                entities = yield this.dynatraceApi.processes(params);
            }
            const result = entities.map((entity) => {
                const key = entity.spec.entityId;
                const timestamp = entity.spec.lastSeenTimestamp;
                const querypart = query.smartscape.split(':');
                const relation = querypart[0];
                const metric = querypart[1];
                if (query.aggregation === 'count') {
                    const value = entity[relation] && entity[relation][metric] ?
                        entity[relation][metric].length : false;
                    return {
                        key,
                        timestamp,
                        value,
                    };
                }
                throw new Error(`Unsupported aggregation for smartscape: ${query.aggregation}`);
            });
            return result;
        });
    }
    getParams(query) {
        const params = {};
        const percentile = /p(\d+)/;
        const percentileMatch = query.aggregation.match(percentile);
        if (percentileMatch) {
            params.aggregationType = 'percentile';
            params.percentile = percentileMatch[1];
        }
        else {
            params.aggregationType = query.aggregation;
        }
        params.startTimestamp = this.timeStart * 1000;
        params.endTimestamp = this.timeEnd * 1000;
        params.entities = query.entityIds;
        params.tags = query.tags;
        return params;
    }
    fetch(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (query.timeseriesId) {
                return this.queryTimeseries(query);
            }
            if (query.smartscape) {
                return this.querySmartscape(query);
            }
            return false;
        });
    }
}
exports.Source = Source;
//# sourceMappingURL=Source.js.map