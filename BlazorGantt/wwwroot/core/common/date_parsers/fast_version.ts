const dateToStr = (format: string, utc: boolean, gantt) => {
	format = format.replace(/%[a-zA-Z]/g, (a) => {
		switch (a) {
			case "%d":
				return `"+to_fixed(date.get${utc?"UTC":""}Date())+"`;
			case "%m":
				return `"+to_fixed((date.get${utc?"UTC":""}Month()+1))+"`;
			case "%j":
				return `"+date.get${utc?"UTC":""}Date()+"`;
			case "%n":
				return `"+(date.get${utc?"UTC":""}Month()+1)+"`;
			case "%y":
				return `"+to_fixed(date.get${utc?"UTC":""}FullYear()%100)+"`;
			case "%Y":
				return `"+date.get${utc?"UTC":""}FullYear()+"`;
			case "%D":
				return `"+locale.date.day_short[date.get${utc?"UTC":""}Day()]+"`;
			case "%l":
				return `"+locale.date.day_full[date.get${utc?"UTC":""}Day()]+"`;
			case "%M":
				return `"+locale.date.month_short[date.get${utc?"UTC":""}Month()]+"`;
			case "%F":
				return `"+locale.date.month_full[date.get${utc?"UTC":""}Month()]+"`;
			case "%h":
				return `"+to_fixed((date.get${utc?"UTC":""}Hours()+11)%12+1)+"`;
			case "%g":
				return `"+((date.get${utc?"UTC":""}Hours()+11)%12+1)+"`;
			case "%G":
				return `"+date.get${utc?"UTC":""}Hours()+"`;
			case "%H":
				return `"+to_fixed(date.get${utc?"UTC":""}Hours())+"`;
			case "%i":
				return `"+to_fixed(date.get${utc?"UTC":""}Minutes())+"`;
			case "%a":
				return `"+(date.get${utc?"UTC":""}Hours()>11?"pm":"am")+"`;
			case "%A":
				return `"+(date.get${utc?"UTC":""}Hours()>11?"PM":"AM")+"`;
			case "%s":
				return `"+to_fixed(date.get${utc?"UTC":""}Seconds())+"`;
			case "%W":
				return `"+to_fixed(getISOWeek(date))+"`;
			case "%w":
				return `"+to_fixed(getWeek(date))+"`;
			default:
				return a;
		}
	});

	// tslint:disable-next-line: function-constructor
	const dateToStrFn = new Function("date", "to_fixed", "locale", "getISOWeek", "getWeek", `return "${format}";`);

	return (date: Date) => {
		return dateToStrFn(date, gantt.date.to_fixed, gantt.locale, gantt.date.getISOWeek, gantt.date.getWeek);
	};
};


const strToDate = (format: string, utc: boolean, gantt:any) => {
	let splt = "var temp=date.match(/[a-zA-Z]+|[0-9]+/g);";
	const mask = format.match(/%[a-zA-Z]/g);
	for (let i = 0; i < mask.length; i++) {
		switch (mask[i]) {
			case "%j":
			case "%d":
				splt += `set[2]=temp[${i}]||1;`;
				break;
			case "%n":
			case "%m":
				splt += `set[1]=(temp[${i}]||1)-1;`;
				break;
			case "%y":
				splt += `set[0]=temp[${i}]*1+(temp[${i}]>50?1900:2000);`;
				break;
			case "%g":
			case "%G":
			case "%h":
			case "%H":
				splt += `set[3]=temp[${i}]||0;`;
				break;
			case "%i":
				splt += `set[4]=temp[${i}]||0;`;
				break;
			case "%Y":
				splt += `set[0]=temp[${i}]||0;`;
				break;
			case "%a":
			case "%A":
				splt += `set[3]=set[3]%12+((temp[${i}]||'').toLowerCase()=='am'?0:12);`;
				break;
			case "%s":
				splt += `set[5]=temp[${i}]||0;`;
				break;
			case "%M":
				splt += `set[1]=locale.date.month_short_hash[temp[${i}]]||0;`;
				break;
			case "%F":
				splt += `set[1]=locale.date.month_full_hash[temp[${i}]]||0;`;
				break;
			default:
				break;
		}
	}
	let code = "set[0],set[1],set[2],set[3],set[4],set[5]";
	if (utc) { code = ` Date.UTC(${code})`; }
	// tslint:disable-next-line: function-constructor
	const strToDateFn = new Function("date", "locale", `var set=[0,0,1,0,0,0]; ${splt} return new Date(${code});`);

	return (dateString) => {
		return strToDateFn(dateString, gantt.locale);
	};
};

const fastVersion = {
	date_to_str: dateToStr,
	str_to_date: strToDate
};

export default fastVersion;