// function predictOnModelTwo(indicators){
        //     d3.dsv(",", "weights2.csv", 
        //         function(d) {
        //             return d
        //         })
        //     .then(function(data){
        //         weights = data
        //         console.log(weights)

        //         var predictedCancer = parseFloat(weights[0].weights)
        //         console.log(predictedCancer)
        //         console.log(indicators[0])

        //         for (i = 0; i < indicators.length; i++){
        //             predictedCancer += indicators[i] * parseFloat(weights[i+1].weights)
        //         }

        //         console.log(predictedCancer)
        //         predictOnModelOne(predictedCancer)
        //     })
        // }

        // function predictOnModelOne(industryValues){
        //     console.log(industryValues*2)
        // }

        // var fakeValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]

        var fakeValues = [1, 2, 3, 4]
        // predictOnModelTwo(fakeValues)
        var cancer = getEditedCancerValues(fakeValues)
        
        function getEditedCancerValues(values){
            var cancer = predictOnModelOne(values)
            
            return cancer
        }

        function predictOnModelOne(industryValues){
            var weightArray = []
            var predictedIndicators = []

            d3.dsv(",", "weights1.csv", 
                function(d) {
                    return d
                })
            .then(function(data){
                weights = data
                console.log(weights)

                // var predictedIndicators = parseFloat(weights[0])
                // console.log(Object.values(weights[0]))
                // weightArray.push(Object.values(weights[0]))
                // console.log(weightArray)
                // weightArray.push(Object.values(weights[1]))
                // console.log(weightArray)

                for (i = 0; i < 5; i++){
                    weightArray.push(Object.values(weights[i]))
                }
                console.log(weightArray)

                for (i = 0; i < 24; i++){
                    indicator = parseFloat(weightArray[0][i])
                    for (j = 0; j < 4; j++){
                        indicator += parseFloat(industryValues[j]) * parseFloat(weightArray[j+1][i])
                    }
                    predictedIndicators.push(indicator)
                }
                console.log(predictedIndicators)

                // var adjustedCancer = predictOnModelTwo(predictedIndicators)
            })
            var cancerOutput = predictOnModelTwo(predictedIndicators)
            return cancerOutput
            // return predictedIndicators
            
        }

        function predictOnModelTwo(indicators){
            var predictedCancer = []

            d3.dsv(",", "weights2.csv", 
                function(d) {
                    return d
                })
            .then(function(data){
                weights = data
                console.log(weights)

                var cancerCalc = parseFloat(weights[0].weights)
                console.log(cancerCalc)
                console.log(indicators[0])

                for (i = 0; i < indicators.length; i++){
                    cancerCalc += indicators[i] * parseFloat(weights[i+1].weights)
                }

                console.log(cancerCalc)
                predictedCancer.push(cancerCalc)
            })
            
            return predictedCancer
            
        }

        define(function (require) {
            var namedModule = require('name');
        });

        var fs = require('fs')

        fs.writeFile('mynewfile1.txt', 'Hello content!', function (err) {
            if (err) {throw err}
            console.log('Saved!');
        });