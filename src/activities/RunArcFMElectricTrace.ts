import type {
  IActivityContext,
  IActivityHandler,
} from "@geocortex/workflow/runtime/IActivityHandler";
import { ChannelProvider } from "@geocortex/workflow/runtime/activities/core/ChannelProvider";
import { activate } from "@geocortex/workflow/runtime/Hooks";

/** An interface that defines the inputs of the activity. */
export interface RunArcFMElectricTraceInputs {
  /**
   * @displayName Service URL
   * @description The URL to the ArcGIS REST service.
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

  protectiveDevices?: string | number;
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
  drawComplexEdges?: boolean;
  includeEdges?: boolean;
  includeJunctions?: boolean;
  returnAttributes?: boolean;
  returnGeometries?: boolean;
  tolerance?: number;
  spatialReference?: {
    wkid?: number;
    wkt?: string;
  };
  currentStatusProgID?: any;
}

/** An interface that defines the outputs of the activity. */
export interface RunArcFMElectricTraceOutputs {
  /**
   * @description The result of the activity.
   */
  results: any[];
}

/**
 * @category ArcFM
 * @displayName Run ArcFM Electric Trace
 * @description Runs an ArcFM electric trace operation.
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
      throw new Error("serviceUrl");
    }

    const channel = type.create(undefined, "arcgis");
    channel.request.url = `${inputs.serviceUrl}/exts/ArcFMMapServer/Electric%20Trace`;
    channel.request.method = "POST";
    channel.request.json = {
      f: "json",
      phasesToTrace,
      traceType,
      ...other,
    };

    await channel.send();

    context.cancellationToken.finally(function () {
      channel.cancel();
    });

    const results = (channel.response.payload as any)?.data?.results || [];

    return {
      results,
    };
  }
}
