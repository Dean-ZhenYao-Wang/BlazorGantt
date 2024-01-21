import extensions from "./ext/extensions_gpl";
import * as base from "./factory/make_instance_web";
import * as scope from "./utils/global";
(scope).gantt = base(extensions);
