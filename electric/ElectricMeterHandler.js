import ElectriMeter from "./ElectriMeter";

export default class{
    async getElmeterData(companyName, accesToken) {
        this.meter=null;//macking shore to to fill up the ram with new and newwer meters
        try{
            const response = await fetch(
              `http://${urladdress}:8081/elmeter/company/address/list`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accesToken}`,
                },
                body: JSON.stringify({
                    company_name: companyName,
                }),
              },
            );
            const datat = await response.json();
            const {address_list}=datat;
            
            address_list.forEach(element => {
                console.log(element)
                //todo make the call for every meter
                writeElmeterDataFromAddress(element)
            });
            
        }catch (error) {
            console.log('Failed to fetch data: ' + error.message);
        }
    }
    
    async writeElmeterDataFromAddress(address){
        //Create new meter and read it
        let elMeter= new ElectriMeter();
        elMeter.setAddressName()
    }
}