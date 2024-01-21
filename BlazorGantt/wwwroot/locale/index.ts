import ar from "./locale_ar";
import be from "./locale_be";
import ca from "./locale_ca";
import cn from "./locale_cn";
import cs from "./locale_cs";
import da from "./locale_da";
import de from "./locale_de";
import el from "./locale_el";
import en from "./locale_en";
import es from "./locale_es";
import fa from "./locale_fa";
import fi from "./locale_fi";
import fr from "./locale_fr";
import he from "./locale_he";
import hr from "./locale_hr";
import hu from "./locale_hu";
import id from "./locale_id";
import it from "./locale_it";
import jp from "./locale_jp";
import kr from "./locale_kr";

import LocaleManager from "./locale_manager";

import nb from "./locale_nb";
import nl from "./locale_nl";
import no from "./locale_no";
import pl from "./locale_pl";
import pt from "./locale_pt";
import ro from "./locale_ro";
import ru from "./locale_ru";
import si from "./locale_si";
import sk from "./locale_sk";
import sv from "./locale_sv";
import tr from "./locale_tr";
import ua from "./locale_ua";

export default function(){
	return new LocaleManager({
		en,
		ar,
		be,
		ca,
		cn,
		cs,
		da,
		de,
		el,
		es,
		fa,
		fi,
		fr,
		he,
		hr,
		hu,
		id,
		it,
		jp,
		kr,
		nb,
		nl,
		no,
		pl,
		pt,
		ro,
		ru,
		si,
		sk,
		sv,
		tr,
		ua
	});
}