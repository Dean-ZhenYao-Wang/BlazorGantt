import { WorkUnitsMapCache } from "./workunit_map_cache";
import { WorkUnitsObjectCache } from "./workunit_object_cache";
export { LargerUnitsCache } from "./larger_units_helper";

export function createCacheObject() {

	// worktime hash is on the hot path,
	// Map seems to work faster than plain array, use it whenever possible
	if (typeof Map !== "undefined") {
		return new WorkUnitsMapCache();
	} else {
		return new WorkUnitsObjectCache();
	}
}
