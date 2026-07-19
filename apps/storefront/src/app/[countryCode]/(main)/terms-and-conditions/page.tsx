import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "Review the general conditions of sale which regulate the purchase of Bacoola products.",
}

export default function TermsAndConditions() {
  return (
    <div className="bg-white min-h-screen pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-[15px] font-bold uppercase tracking-wide text-neutral-950 mb-4">
          Terms and conditions
        </h1>
        <p className="text-[11px] sm:text-[12px] text-neutral-900 mb-10">
          Latest version: 07/07/2026
        </p>

        <section className="mb-12">
          <h2 className="text-[14px] sm:text-[15px] font-bold uppercase tracking-wide text-neutral-950 mb-4">
            Introduction
          </h2>
          <div className="space-y-4 text-[12px] sm:text-[13px] text-neutral-900 leading-[1.8] font-normal">
            <p>
              Mango offers you an online purchasing service which allows you to purchase a selection of the items available at our stores from your computer. You can also benefit from promotions, gifts and exclusive offers.
            </p>
            <p>
              Below, we invite you to review the general conditions of sale which regulate the purchase of Mango products via this Website. Therefore, use of this Webpage implies your acceptance of these general conditions of sale. However, if you have any queries regarding the same, please contact our <a href="/help" className="font-bold underline underline-offset-[3px] decoration-[1.5px] text-neutral-950 hover:text-neutral-500 transition-colors">Customer Services</a> department.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-[14px] sm:text-[15px] font-bold uppercase tracking-wide text-neutral-950 mb-4">
            Our details
          </h2>
          <div className="space-y-4 text-[12px] sm:text-[13px] text-neutral-900 leading-[1.8] font-normal">
            <p>The following conditions regulate the sale of products featured on this Webpage by the company:</p>
            <p>MANGO MNG, S.A. (hereinafter, "Mango")</p>
            <p>
              Via Augusta, 10<br />
              Pol. Ind. Riera de Caldes<br />
              C.P. 08184 Palau-solità i Plegamans<br />
              Barcelona (Spain)
            </p>
            <p>
              Registered in the Barcelona Companies Register under Volume/IRUS 1000318835574, Folio 3, Sheet B 167948, Entry 147 and with VAT Number ES-A59088948.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-[14px] sm:text-[15px] font-bold uppercase tracking-wide text-neutral-950 mb-4">
            Contract
          </h2>
          
          <h3 className="text-xs sm:text-[13px] font-bold text-neutral-900 mb-3 mt-6">Availability of the service</h3>
          <div className="space-y-4 text-[12px] sm:text-[13px] text-neutral-900 leading-[1.8] font-normal">
            <p>
              By placing an order on the Website/App, you guarantee that you are 18 years old or over. The products offered are distributed in the following member states of the European Union: Austria, Belgium, Bulgaria, Croatia, Cyprus (southern area), Czech Republic, Denmark, Estonia, Finland, France (metropolitan area), Germany, Greece, Hungary, Ireland, Italy (except San Marino, Livigno, Campione, Vatican City and Italian waters of Lake Lugano), Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Romania, Slovakia, Slovenia, Spain (including the Canary Islands, Ceuta and Melilla), Sweden and the United Kingdom.
            </p>
            <p>
              Our products are also distributed in the following countries: Albania, Andorra, Aruba, Australia, Bahrain, Bosnia-Herzegovina, Canada, Channel Islands, China, Colombia, Costa Rica, Curaçao, Egypt, French Guyana, Guadeloupe, Guatemala, Hong Kong, India, Indonesia, Iceland, Jordan, Kazakhstan, Kuwait, Lebanon, Liechtenstein, Macao, Malaysia, Maldives, Martinique, Mexico, Monaco, Nicaragua, Norway, Qatar, Oman, Panama, Philippines, Russia, Salvador, Saudi Arabia, Serbia, Singapore, South Africa, South Korea, Switzerland, Turkey, United Arab Emirates, United States, Uzbekistan.
            </p>
            <p>
              You may purchase from the country of your choice, but we are only able to send your order to addresses located in the chosen country. The delivery methods, conditions of sale and delivery points will be updated when you change the country.
            </p>
          </div>

          <h3 className="text-xs sm:text-[13px] font-bold text-neutral-900 mb-3 mt-8">Purchase guarantee</h3>
          <div className="space-y-4 text-[12px] sm:text-[13px] text-neutral-900 leading-[1.8] font-normal">
            <p>
              The items offered on this Webpage are a selection of products from the Women's, Men's, Children's and Babies' collections and meet the same quality requirements and guarantee as the products on sale at MANGO Group stores.
            </p>
            <p>Each product features the following details:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name of the article</li>
              <li>Photo of the article</li>
              <li>Description of the article</li>
              <li>Available sizes and colours*</li>
              <li>Composition</li>
              <li>Wash and care instructions</li>
              <li>Price (in the corresponding currency)</li>
            </ul>
            <p className="text-neutral-500 italic">
              *Mango has made every effort to display the colours of the items as realistically as possible. However, the colour of the garments that appear on the screen may be subject to changes depending on the quality of your computer monitor. Therefore, Mango cannot guarantee that the colours that appear on your monitor are a true representation of the actual colours.
            </p>
            <p>
              Special offers, promotions or discounts will be valid until the indicated date or while stocks last.
            </p>
            <p>
              Similarly, Mango makes every effort to ensure that the information contained on its website is complete, accurate and correct. In the event of any error, Mango will proceed to correct it immediately.
            </p>
          </div>

          <h3 className="text-xs sm:text-[13px] font-bold text-neutral-900 mb-3 mt-8">Purchase procedure</h3>
          <div className="space-y-4 text-[12px] sm:text-[13px] text-neutral-900 leading-[1.8] font-normal">
            <ol className="list-decimal pl-5 space-y-3">
              <li>Select the articles you wish to purchase and add them to the shopping basket, by clicking on the corresponding icon.</li>
              <li>The shopping basket contains the reference of the selected item, its name, size, colour and price in the corresponding country (including taxes). The quoted price does not include transport costs, which will vary according to the delivery method selected.</li>
              <li>To proceed with the purchase, the user's personal details will be required and will be included on our database in order to process the order and simplify future purchases via the Website. The personal details provided by users will be treated in accordance with our <a href="/privacy-policy" className="font-bold underline underline-offset-[3px] decoration-[1.5px] text-neutral-950 hover:text-neutral-500 transition-colors">Privacy Policy</a>. Users may, at any moment, access the personal details they have provided and information on the orders they have placed. Mango reminds users that their personal details must be as accurate as possible in order to avoid any confusion or errors in the dispatch of the item(s) purchased. Furthermore, wherever expressly requested by users, they will receive information and publications relative to the MANGO Group by post and/or SMS.</li>
              <li>Once the order has been completed, and before the order is confirmed, the user will be provided with an itemised summary of the order, identifying the item(s) purchased, the total price (including transport and taxes) and the order delivery details, in order for the user to confirm this by clicking on the 'Confirm payment' button.</li>
            </ol>
            <p>
              Purchases may be paid for using a credit or debit card (Visa, Visa Electron and MasterCard). Payment method other than the one specified in the present conditions of sale will not be accepted. For payments by credit or debit card, the charge will be made online, in other words, in real time, through the payment gateway of the corresponding financial entity, once it has been confirmed that the data sent by the user is correct.
            </p>
            <p>
              Once the transaction has been confirmed, the order number will be displayed on the webpage, allowing users to track the order from their computer at any moment.
            </p>
            <p>
              An automated order confirmation e-mail will also be sent to the address indicated by the user with acknowledgement of receipt, with a description of the order and the personal details provided. If you do not receive this e-mail, this could be due to a temporary communications problem in the network or an error in the e-mail address entered. In both cases, Mango advises the user to contact <a href="/help" className="font-bold underline underline-offset-[3px] decoration-[1.5px] text-neutral-950 hover:text-neutral-500 transition-colors">Customer Services</a>. Similarly, an e-mail will be sent to the user confirming that the product has been dispatched.
            </p>
          </div>

          <h3 className="text-xs sm:text-[13px] font-bold text-neutral-900 mb-3 mt-8">Availability of products</h3>
          <div className="space-y-4 text-[12px] sm:text-[13px] text-neutral-900 leading-[1.8] font-normal">
            <p>
              All orders are subject to the products being available. If, at the time the order is issued, our warehouse detects that there are no stocks of any of the products included within it, Mango will make every effort to locate the item. If this is not possible, the user will be notified immediately. In addition, the amount charged for the unsent item will be refunded to the customer, using the same payment method used to purchase the item.
            </p>
          </div>

          <h3 className="text-xs sm:text-[13px] font-bold text-neutral-900 mb-3 mt-8">Right not to accept an order</h3>
          <div className="space-y-4 text-[12px] sm:text-[13px] text-neutral-900 leading-[1.8] font-normal">
            <p>Mango may cancel or refuse to accept any confirmed order on the following grounds:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>In the event of a technical and/or typing error in the prices or other details of products contained on the webpage when the order was placed.</li>
              <li>Due to a lack of availability, as described in point 3.4.</li>
              <li>When the security systems indicate that the order may be fraudulent.</li>
              <li>When there are reasons to indicate that the user is a minor.</li>
              <li>If Mango was unable to deliver the order to the address provided.</li>
            </ol>
            <p>Mango will fully reimburse any sums that have been paid.</p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-[14px] sm:text-[15px] font-bold uppercase tracking-wide text-neutral-950 mb-4">
            Price and payment
          </h2>
          <div className="space-y-4 text-[12px] sm:text-[13px] text-neutral-900 leading-[1.8] font-normal">
            <h3 className="text-xs sm:text-[13px] font-bold text-neutral-900">Payment and currency</h3>
            <p>The prices on this Webpage are quoted in RS.</p>
            <p>Mango allows users the option to select the destination country before placing their order, so that they can see the prices with the corresponding taxes included. If the customer subsequently modifies the delivery address and the destination country, the prices displayed in the final summary of the order may vary.</p>
            
            <h3 className="text-xs sm:text-[13px] font-bold text-neutral-900 mt-6">Taxes</h3>
            <p>All products listed on your final order will include all applicable taxes at the current rate in force.</p>

            <h3 className="text-xs sm:text-[13px] font-bold text-neutral-900 mt-6">Payment methods</h3>
            <p>Mango only accepts payment by credit or debit card (Visa, Visa Electron and MasterCard).</p>
            
            <p className="font-bold text-neutral-900 mt-4">Payment by credit or debit card</p>
            <p>Mango accepts payments for purchases made via its Website with the following credit or debit cards: Visa, Visa Electron and MasterCard.</p>
            <p>For payments by credit or debit card, the charge will be made online, in other words, in real time, through the payment gateway of the corresponding financial entity, once it has been confirmed that the data sent by the user is correct.</p>

            <h3 className="text-xs sm:text-[13px] font-bold text-neutral-900 mt-6">Payment security</h3>
            <p>
              In order to offer maximum security in the payment system, Mango uses the secure payment systems of the leading financial entities in e-commerce. Therefore, all confidential data is transferred directly and in an encrypted format (SSL) to the corresponding financial entity. For payment by Visa and MasterCard, Mango only accepts SET transactions (Secure Electronic Transactions) using the 3D Secure international protocol, which can be identified by the Verified by Visa and MasterCard SecureCode logos. The basic aim of the Secure Electronic Transactions initiative is to guarantee the security of Internet transactions. When you make payment through the secure payment gateway, the system will automatically check whether the credit card has been activated for Secure Electronic Transactions. Next, it will connect with the issuing bank of the card, which will request authorisation for the operation via a personal authentication code. The operation will only proceed if the issuing bank of the card confirms the authentication code. In all other cases, the transaction will be rejected. We also have the GeoTrust SSL safety certificate for online transactions.
            </p>
            <p>
              As a complementary measure to the 'Secure payment' system, and in order to collaborate in the prevention of Internet fraud, Mango reserves the right to check the personal details provided by customers and to take the appropriate steps (including the cancellation of the order) in order to ensure that goods are dispatched in accordance with the data that is stated on the order.
            </p>

            <h3 className="text-xs sm:text-[13px] font-bold text-neutral-900 mt-6">Purchase limit</h3>
            <p>The maximum amount per purchase is Rs. 32,500 and it cannot include more than 40 products.</p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-[14px] sm:text-[15px] font-bold uppercase tracking-wide text-neutral-950 mb-4">
            Delivery
          </h2>
          <div className="space-y-4 text-[12px] sm:text-[13px] text-neutral-900 leading-[1.8] font-normal">
            <p>
              Delivery of items purchased at Mango.com will be carried out via an international courier company and delivered in approximately 6 to 8 working days. To get your order, you'll be required to provide your KYC. Delivery is free for orders over Rs. 6,500, and charged at Rs. 790 in the case of orders below this amount.
            </p>
            <p>
              In order to avoid any delivery problems (incorrect addresses, nobody at home, etc.), you must complete the applicable form correctly and it is advisable to leave a contact telephone number in the corresponding field.
            </p>
            <p>
              Orders can be tracked via the Mango.com Webpage, indicating the location of the goods at each moment until final reception.<br />
              The delivery cost is calculated according to the delivery method chosen and the items purchased. The exact transport cost will be calculated every time an item is added to the shopping basket, and will be displayed on the order summary page that appears before the customer confirms the order by pressing the 'Confirm Payment' button, and before the credit card or debit card details are entered.
            </p>
            <p>Orders cannot be delivered to military bases or PO boxes.</p>
            <p>
              The delivery charges may be altered at any time without prior notice. Said change shall become effective from the moment the modification appears in the help pages and in the contract published on this Webpage. In all cases, the delivery charges that appear at the moment the order is placed shall apply.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-[14px] sm:text-[15px] font-bold uppercase tracking-wide text-neutral-950 mb-4">
            Online exchanges and/or returns policy
          </h2>
          <div className="space-y-4 text-[12px] sm:text-[13px] text-neutral-900 leading-[1.8] font-normal">
            <h3 className="text-xs sm:text-[13px] font-bold text-neutral-900">Exchange and/or returns conditions</h3>
            <p>
              The Customer has the right to withdraw from the purchase and return the product(s) purchased and/or exchange their size (except for the products described in clause 6.2. below), without the need for justification, within 30 calendar days from the dispatch date. If the products in their confirmed order are delivered separately, on different dates, the dispatch date of the last product shall apply for the purposes of the return.
            </p>
            <p>
              Mango cannot accept exchanges or returns of used or damaged items (except in the case of flaws). For reasons of hygiene, underwear and swimwear items are fitted with a safety seal to prevent them being tried on or worn. If you wish to return this type of item, the label and the safety seal must remain intact.
            </p>
            <p>Face masks cannot be exchanged or returned for health and safety reasons.</p>
            <p>For reasons of hygiene, earrings cannot be exchanged or returned.</p>
            <p>It is not possible to change one model for another: it is only possible to exchange it for a different size. To exchange one item for another, you must follow the refund procedure and make a new purchase.</p>
            <p>
              All returns of purchased items must be carefully packaged and include a duly completed delivery note or returns form.<br />
              If you do not have said delivery note when making the exchange or return, you can download the returns form by accessing the order page.
            </p>
            <p>The in-store purchases can only be exchanged, returns are not accepted.</p>
            <p>
              Mango reserves the right to review and evaluate each claim related to undelivered or incomplete orders. If reasonable indications of improper and/or fraudulent use of the Website are detected in the fulfilment of such orders, Mango may refuse the refund request and temporarily suspend the Customer's account.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-[14px] sm:text-[15px] font-bold uppercase tracking-wide text-neutral-950 mb-4">
            Contact
          </h2>
          <div className="space-y-4 text-[12px] sm:text-[13px] text-neutral-900 leading-[1.8] font-normal">
            <p>For any queries or suggestions, you may contact Mango by e-mail or by post at the following address:</p>
            <p>
              MANGO<br />
              Dpto. de Atención al Cliente<br />
              Via Augusta, 10<br />
              Pol. Ind. Riera de Caldes<br />
              C.P. 08184 Palau-solità i Plegamans<br />
              Barcelona (Spain)
            </p>
            <p>
              The Customer Services telephone number is: +34 93 860 24 24. The office hours are Monday to Friday from 9am to 8:30pm Spanish local time (international call).
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}
