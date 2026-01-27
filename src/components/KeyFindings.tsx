import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Users, Activity, TrendingUp, AlertCircle, FlaskConical } from 'lucide-react';

export function KeyFindings() {
  const clusters = [
    {
      id: 0,
      percentage: '18.1%',
      color: 'border-l-4 border-l-red-500',
      bgColor: 'bg-red-50',
      badgeColor: 'bg-red-100 text-red-700',
      characteristics: {
        pm25: 'Highest average PM2.5 exposure',
        inflammation: 'High inflammation (CRP)',
        age: 'Older average age',
        cvdRate: '20.74%'
      },
      link: {
        description: 'Most vulnerable. CVD risk highest at the lowest PM2.5 levels and increases significantly as exposure rises.',
        score: '-0.7232',
        interpretation: 'Most vulnerable'
      }
    },
    {
      id: 1,
      percentage: '41.3%',
      color: 'border-l-4 border-l-amber-500',
      bgColor: 'bg-amber-50',
      badgeColor: 'bg-amber-100 text-amber-700',
      characteristics: {
        pm25: 'Low PM2.5 and inflammation',
        inflammation: 'Low inflammation',
        age: 'Very high average age (66 years)',
        cvdRate: '20.58%'
      },
      link: {
        description: 'Strong positive link. Risk increases notably with higher PM2.5 levels.',
        score: '0.5388',
        interpretation: 'Strong positive link'
      }
    },
    {
      id: 2,
      percentage: '48.4%',
      color: 'border-l-4 border-l-green-600',
      bgColor: 'bg-green-50',
      badgeColor: 'bg-green-100 text-green-700',
      characteristics: {
        pm25: 'Low PM2.5 and inflammation',
        inflammation: 'Low inflammation',
        age: 'Youngest group (45.7 years)',
        cvdRate: '19.76%'
      },
      link: {
        description: 'Least affected. CVD risk is not as strongly influenced by PM2.5 exposure.',
        score: '0.1804',
        interpretation: 'Least affected'
      }
    }
  ];

  const topPredictors = [
    { name: 'HbA1c', description: 'Blood sugar levels', emphasis: true },
    { name: 'Cystatin_C', description: 'Kidney function marker', emphasis: true },
    { name: 'PM2.5 Exposure', description: 'Air pollution particulate matter', emphasis: false },
    { name: 'Platelets', description: 'Blood cell count', emphasis: false },
    { name: 'Cholesterol', description: 'Blood lipid levels', emphasis: false },
    { name: 'Creatinine', description: 'Kidney function indicator', emphasis: false },
    { name: 'LDL', description: 'Low-density lipoprotein', emphasis: false },
    { name: 'Glucose', description: 'Blood sugar measurement', emphasis: false }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Key Findings: Identifying Vulnerability and Disease Risk
        </h1>
        <p className="text-lg text-muted-foreground">
          Understanding the relationship between air pollution exposure, population characteristics, and cardiovascular disease risk
        </p>
      </div>

      {/* Section 1: Finding Different Groups of People */}
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Finding Different Groups of People</h2>
          </div>
          <p className="text-muted-foreground">
            Population clustering analysis reveals three distinct groups with varying vulnerability to air pollution and cardiovascular disease risk.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {clusters.map((cluster) => (
            <Card key={cluster.id} className={`${cluster.color} overflow-hidden`}>
              <CardHeader className={cluster.bgColor}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Cluster {cluster.id}</CardTitle>
                  <Badge className={cluster.badgeColor}>{cluster.percentage}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">of population</p>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">PM2.5 Exposure</p>
                    <p className="text-sm">{cluster.characteristics.pm25}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Inflammation (CRP)</p>
                    <p className="text-sm">{cluster.characteristics.inflammation}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Age Profile</p>
                    <p className="text-sm">{cluster.characteristics.age}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium">CVD Event Rate</span>
                    <span className="text-2xl font-bold">{cluster.characteristics.cvdRate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 2: The Link Between Air Pollution and Disease Risk */}
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">The Link Between Air Pollution and Disease Risk</h2>
          </div>
          <p className="text-muted-foreground">
            Susceptibility scores reveal how PM2.5 exposure impacts cardiovascular disease risk across different population clusters.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {clusters.map((cluster) => (
            <Card key={`link-${cluster.id}`} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-4 md:w-48">
                    <div className={`w-16 h-16 rounded-lg ${cluster.bgColor} flex items-center justify-center`}>
                      <span className="text-xl font-bold">C{cluster.id}</span>
                    </div>
                    <div>
                      <Badge className={`${cluster.badgeColor} mb-1`}>{cluster.link.interpretation}</Badge>
                      <p className="text-sm text-muted-foreground">{cluster.percentage} of population</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <p className="text-sm">{cluster.link.description}</p>
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-xs font-medium text-muted-foreground">Susceptibility Score:</span>
                      <code className="px-3 py-1 bg-muted rounded text-sm font-bold">{cluster.link.score}</code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-blue-900">Interpreting Susceptibility Scores</p>
                <p className="text-sm text-blue-800">
                  Negative scores indicate inverse relationships where risk may be highest at lower exposure levels. 
                  Positive scores indicate direct relationships where risk increases with exposure. 
                  Higher absolute values indicate stronger relationships.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Section 3: Key Predictors of Risk */}
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Key Predictors of Risk</h2>
          </div>
          <p className="text-muted-foreground">
            Machine learning analysis identified the most important biomarkers and environmental factors in predicting cardiovascular disease risk.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Predictors */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Top Predictors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topPredictors.filter(p => p.emphasis).map((predictor, index) => (
                <div key={predictor.name} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base">{predictor.name}</p>
                    <p className="text-sm text-muted-foreground">{predictor.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Other Important Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Other Important Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2.5">
                {topPredictors.filter(p => !p.emphasis).map((predictor, index) => (
                  <li key={predictor.name} className="flex items-start gap-3 pb-2.5 border-b last:border-0">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-medium">
                      {index + 3}
                    </span>
                    <div className="flex-1 pt-0.5">
                      <p className="font-medium text-sm">{predictor.name}</p>
                      <p className="text-xs text-muted-foreground">{predictor.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-6">
            <div className="space-y-3">
              <h3 className="font-semibold">PM2.5 Importance</h3>
              <p className="text-sm text-muted-foreground">
                PM2.5 exposure was identified as a very important predictor across all population clusters. 
                While individual biomarkers like HbA1c and Cystatin_C showed the strongest predictive power, 
                environmental air pollution exposure (PM2.5) remains a critical modifiable risk factor for cardiovascular disease.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Summary Footer */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardContent className="p-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Research Implications</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-2">
                <p className="font-medium">Population Heterogeneity</p>
                <p className="text-muted-foreground">
                  Three distinct population clusters show different vulnerability patterns to air pollution exposure.
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Targeted Interventions</p>
                <p className="text-muted-foreground">
                  Understanding cluster-specific susceptibility enables more precise public health strategies.
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">Multi-Factor Risk</p>
                <p className="text-muted-foreground">
                  Both biological markers and environmental factors contribute to cardiovascular disease risk.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
