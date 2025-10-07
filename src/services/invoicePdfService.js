import { Document, Page, Text, Image, View, StyleSheet, Font } from "@react-pdf/renderer";
import hhLogo from "../assets/logowhitegreen.png";
import * as utils from "../utils.js";
import * as invoiceService from "./invoiceService.js";

export async function make(customer) {
    if(!customer) return;
    const invoice = await invoiceService.getTotal(customer.id);

    const title = `Invoice: ${customer.name}`;
    let currentDate = "";
    return (
        <Document>
            <Page>
                <View style={styles.header}>
                    <Image src={hhLogo} style={styles.logo} />
                    <Text style={styles.title}>{title}</Text>
                </View>
                {invoice.itemizedList.map((item) => {
                    let dateView = (<></>);
                    const date = utils.to_www_ddMMM(item.date);
                    if(currentDate !== date) {
                        dateView = (<Text style={styles.date}>{date}</Text>)
                        currentDate = date;
                    }
                    const dishes = !utils.isEmpty(item.dishes) ? Object.values(item.dishes) : [];
                    const paidDishes = dishes.filter((dish) => !dish.isFree && dish.customerPrice !== 0);
                    return (
                        <View>
                            {dateView}
                            <View style={styles.itemView}>
                                <View style={styles.itemRow}>
                                    <Text style={styles.item}>{getName(item)}</Text>
                                    <View style={styles.dottedLine} />
                                    <Text style={styles.itemPrice}>{getPrice(item)}</Text>
                                </View>
                                {paidDishes.map((dish) => {
                                    return (
                                        <View style={styles.itemRow}>
                                            <Text style={styles.subItem}>• {getDishName(dish)}</Text>
                                            <View style={styles.dottedLine} />
                                            <Text style={styles.subItemPrice}>{getDishPrice(dish)}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    );
                })} 
                <Text style={styles.total}>Total: {utils.getCurrency()} {utils.formatDisplayPrice(invoice.total)}</Text>
                <Text style={styles.metadata}>{utils.to_yyMMddHHmm(null, "/")}</Text>
            </Page>
        </Document>
    );
};

export function makeTitle(customer) {
    if(!customer) return "invoice.pdf";
    
    const customerName = customer.name.replace(/ /g, "-");
    const date = utils.to_YYMMdd(customer.checkOutAt);
    const uuid = Date.now();
    const filename = `${date} invoice ${customerName} ${uuid}.pdf`;
    return filename;
}

const getPrice = function(item) {
    const price = item.isFree ? 0 : item.customerPrice;
    return `${utils.formatDisplayPrice(price)}`;
}

const getName = function(item) {
    const name = `${item.displayName}`;
    return `${utils.capitalizeWords(name)}`;
}

const getDishPrice = function(dish) {
    const price = dish.isFree ? 0 : `${utils.formatDisplayPrice(dish.quantity * dish.customerPrice)}`;
    return `${utils.formatDisplayPrice(price)}`;
}

const getDishName = function(dish) {
    const course = utils.isString(dish.course) ? dish.course.trim().toLowerCase() : "";
    const displayedCourse = course === "extra" || course === "custom" ? ` (${course})` : "";
    const name = `${dish.quantity}x ${dish.name}${displayedCourse}`;
    return `${utils.capitalizeWords(name)}`;
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',   // horizontal layout
        alignItems: 'center',   // vertically center
        marginBottom: 20
    },
    logo: {
        width: 200, 
        height: 200, 
        marginTop: 20
    },
    title: {
        fontSize: 20,
        marginLeft: 10
    },
    date: {
        textAlign: 'left',
        fontSize: 12,
        marginLeft: 30,
    },
    itemView: {
        marginBottom: 5
    },
    item: {
        //fontFamily: 'Roboto',
        textAlign: 'left',
        fontSize: 12,
        marginLeft: 40,
        flexShrink: 0,
    },
    subItem: {
        textAlign: 'left',
        fontSize: 9,
        marginLeft: 50,
        flexShrink: 0,
    },
    itemPrice: {
        fontSize: 12,
        marginRight: 50,
        textAlign: 'right',
        flexShrink: 0,
    },
    subItemPrice: {
        fontSize: 9,
        marginRight: 50,
        textAlign: 'right',
        flexShrink: 0,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', 
    },
    dottedLine: {
        flexGrow: 1,
        borderBottom: '1 dotted black',
        marginHorizontal: 4,
    },
    total: {
        marginTop: 50,
        textAlign: 'left',
        fontSize: 15,
        marginLeft: 40,
    },
    metadata: {
        position: 'absolute',
        top: 30, 
        right: 30,  
        fontSize: 8,
        color: 'gray',
    }
});
