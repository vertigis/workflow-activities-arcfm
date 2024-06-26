import type {
    IActivityContext,
    IActivityHandler,
} from "@vertigis/workflow/IActivityHandler";
import { ChannelProvider } from "@vertigis/workflow/activities/core/ChannelProvider";
import { activate } from "@vertigis/workflow/Hooks";

export interface RunArcFMElectricTraceInputs {
    /* eslint-disable @typescript-eslint/no-redundant-type-constituents */

    /**
     * @displayName Service URL
     * @description The URL to the ArcGIS REST service. For example, http://server/arcgis/rest/services/<serviceName>/MapServer. The service must support the ArcFMMapServer extension.
     * @required
     */
    serviceUrl: string;

    /**
     * @description The start point of the trace.
     * @required
     */
    startPoint?: {
        x: number;
        y: number;
        spatialReference?: {
            wkid?: number;
            wkt?: string;
        };
    };

    /**
     * @description The type of trace to perform.
     */
    traceType?:
        | "Downstream"
        | "Upstream"
        | "Distribution"
        | "DownstreamProtective"
        | "UpstreamProtective"
        | "NextUpstreamProtective"
        | "ProtectiveIsolation"
        | string;

    /**
     * @description The layer IDs corresponding to the protective devices that participate in the trace.
     */
    protectiveDevices?: number | number[];

    /**
     * @description The phases to be included in the trace.
     */
    phasesToTrace?:
        | "Any"
        | "A"
        | "B"
        | "C"
        | "AB"
        | "AC"
        | "BC"
        | "ABC"
        | "AtLeastA"
        | "AtLeastB"
        | "AtLeastC"
        | "AtLeastAB"
        | "AtLeastAC"
        | "AtLeastBC"
        | "AnySinglePhase"
        | "AnyTwoPhases"
        | string;

    /**
     * @description Whether the trace should draw complex edges. The default is false.
     */
    drawComplexEdges?: boolean;

    /**
     * @description Whether the user has identified edges to be included in the trace. The default is true.
     */
    includeEdges?: boolean;

    /**
     * @description Whether the user has identified junctions to be included in the trace. The default is true.
     */
    includeJunctions?: boolean;

    /**
     * @description Whether to include attribute values in the trace results. The default is false.
     */
    returnAttributes?: boolean;

    /**
     * @description Whether to include feature geometries in the trace results. The default is true.
     */
    returnGeometries?: boolean;

    /**
     * @description A numerical value indicating the search tolerance for the trace in map units.
     */
    tolerance?: number;

    /**
     * @description The spatial reference for the results. By default, the results use the spatial reference of the map service.
     */
    spatialReference?: {
        wkid?: number;
        wkt?: string;
    };

    /**
     * @description The progID of the current status object.
     */
    currentStatusProgID?: any;
    
    /* eslint-enable @typescript-eslint/no-redundant-type-constituents */
}

export interface RunArcFMElectricTraceOutputs {
    /**
     * @description The result of the activity.
     */
    results: {
        displayFieldName: string;
        fieldAliases: {
            [key: string]: string;
        };
        fields: {
            alias: string;
            name: string;
            type: string;
            length?: number;
        }[];
        features: {
            attributes: {
                [key: string]: string;
            };
            geometry?: any;
        }[];
        geometryType?: string;
        spatialReference?: {
            wkid?: number;
            wkt?: string;
        };
        name: string;
        id: number;
        exceededThreshold: boolean;
    }[];
}

/**
 * @category ArcFM
 * @displayName Run ArcFM Electric Trace
 * @description Runs an ArcFM electric trace operation.
 * @helpUrl https://resources.arcfmsolution.com/10.2.1d/ServerSDK/webframe.html#topic41789.html
 * @clientOnly
 * @unsupportedApps GMV
 */
@activate(ChannelProvider)
export class RunArcFMElectricTrace implements IActivityHandler {
    async execute(
        inputs: RunArcFMElectricTraceInputs,
        context: IActivityContext,
        type: typeof ChannelProvider
    ): Promise<RunArcFMElectricTraceOutputs> {
        const {
            phasesToTrace = "Any",
            serviceUrl,
            traceType = "Downstream",
            ...other
        } = inputs;
        if (!serviceUrl) {
            throw new Error("serviceUrl is required");
        }

        // Remove trailing slashes
        const normalizedUrl = serviceUrl.replace(/\/*$/, "");

        const channel = type.create(undefined, "arcgis");
        channel.request.url = `${normalizedUrl}/exts/ArcFMMapServer/Electric%20Trace`;
        channel.request.method = "POST";
        channel.request.json = {
            f: "json",
            phasesToTrace,
            traceType,
            ...other,
        };

        await channel.send();

        void context.cancellationToken.finally(function () {
            channel.cancel();
        });

        const responseData =
            channel.response.payload &&
            (channel.getResponseData(channel.response.payload) as any);
        const results =
            responseData?.results || responseData?.data?.results || [];

        return {
            results,
        };
    }
}
