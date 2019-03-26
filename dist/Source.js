"use strict";
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
    fetch(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {};
            // Only timeseries for now
            if (!query.timeseriesId)
                return false;
            const percentile = /p(\d+)/;
            const percentileMatch = query.aggregation.match(percentile);
            if (percentileMatch) {
                params.aggregationType = 'percentile';
                params.percentile = percentileMatch[1];
            }
            else {
                params.aggregationType = query.aggregation;
            }
            params.relativeTime = 'day';
            params.entities = query.entityIds;
            params.tags = query.tags;
            params.queryMode = 'TOTAL';
            const timeseries = yield this.dynatraceApi.timeseries(query.timeseriesId, params);
            const values = Object.values(timeseries.spec.dataPoints);
            if (!values.length)
                return false;
            return values[0][0][1];
        });
    }
}
exports.Source = Source;
//# sourceMappingURL=Source.js.map