# **Scatter Plot**

Scatter plot visualization to show trend of environmental impacts and social parameters across various counties in USA and its corresponding cancer incidences.

Note that log scale has been used on x axis, and we only represent x values greater than 0.1, since we cannot represent 0 on the log scale.

#### **Observations**:

1. Notice that for some of the parameters, there is a *point of inflection* in the distribution of data, such that after a critical point in this parameter, the cancer incidences starts increasing dramatically.

   eg: the FOOD parameter ![scatter_food](/home/duran/Desktop/Data and Visual Analytics/DataVisualAnalytics_Industries-cancer/demo_viz/d3_scatter/scatter_food.png)

   

2. For other parameters, it is very confusing, because for lower values of the given parameter too, the cancer incidences are all over the place, and cant follow a good trend. 

   eg: the METL parameter ![scatter_metl](/home/duran/Desktop/Data and Visual Analytics/DataVisualAnalytics_Industries-cancer/demo_viz/d3_scatter/scatter_metl.png)

   

This is a preliminary assessment. I was hoping to add a non-linear trend line to this dataset, but I don't know if that is really going to add much value, for now I am going to keep this visualization as it is.