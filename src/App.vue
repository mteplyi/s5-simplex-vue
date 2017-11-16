<template>
	<div id="app">
		<label class="setup-label">
			Variables count:
			<input type="number" min="1" max="100" :value="varsCount"
			       @change="changeVarsCount(toMinMaxNumberInput($event))">
		</label>
		<label class="setup-label">
			Limitations count:
			<input type="number" min="1" max="100" :value="limitsCount"
			       @change="changeLimitsCount(toMinMaxNumberInput($event))">
		</label>
		<table class="input-table">
			<tr>
				<th>
				<th v-for="j in varsCount">x{{j}}</th>
			</tr>
			<tr>
				<th>f(x)=</th>
				<td v-for="(cj,j) in c">
					<input type="text" :value="cj.toFraction()" @change="$set(c,j,fraction($event.target.value))" title="a">
				</td>
				<th> &rArr;</th>
				<td>
					<button @click="M*=-1">{{M === 1 ? 'min' : 'max'}}</button>
				</td>
			</tr>
			<tr v-for="(aiRow,i) in a">
				<th>{{i + 1}}</th>
				<td v-for="(aij,j) in aiRow">
					<input type="text" :value="aij.toFraction()"
					       @change="$set(a[i],j,fraction($event.target.value))" title="a">
				</td>
				<td>
					<button type="button"
					        @click="$set(limitsSigns,i,limitsSigns[i]+1===compareSigns.length?0:limitsSigns[i]+1)">
						{{compareSigns[limitsSigns[i]]}}
					</button>
				</td>
				<td>
					<input type="text" :value="b[i].toFraction()" @change="$set(b,i,fraction($event.target.value))" title="b">
				</td>
			</tr>
		</table>
		<button class="eval-button" @click="evalSimplex()">Evaluate</button>
		<table class="simplex-table">
			<template v-for="(iteration,index) in iterations">
				<tr>. . .</tr>
				<tr>{{index === 0 ? 'Initial plan' : `Iteration ${index}`}}</tr>
				<tr>
					<th>i</th>
					<th>Basis</th>
					<th>Cb</th>
					<th v-for="j in iteration.a[0].length">P{{j - 1}}</th>
				</tr>
				<tr v-for="(aiRow,i) in iteration.a">
					<th>{{i + 1}}</th>
					<th>{{getPByIndex(iteration.cb[i])}}</th>
					<td>{{getCByIndex(iteration.cb[i])}}</td>
					<td v-for="aij in aiRow">{{aij.toFraction()}}</td>
				</tr>
			</template>
		</table>
		<template v-if="solution">
			<p>{{printX()}}</p>
			<p>{{printFX()}}</p>
		</template>
		<p v-if="noSolutions">It`s no solutions there!</p>
	</div>
</template>

<script>
	import simplex from './simplex';
	import fraction from './utils/fraction';
	import genArray from './utils/genArray';
	
	const defaultVarsCount = 2;
	const defaultLimitsCount = 3;
	const defaultSignType = 0;
	
	export default {
		name: 'app',
		data() {
			return {
				limitsCount: defaultLimitsCount,
				varsCount: defaultVarsCount,
				c: genArray(defaultVarsCount).
						map(this.fraction), //c: [3, 7].map(this.fraction),
				M: 1,
				a: genArray(defaultLimitsCount).
						map(() => genArray(defaultVarsCount).
								map(this.fraction)), //a: [[1, 2], [-5, 3], [2, 3]].map(r => r.map(this.fraction)),
				compareSigns: ['\u2264', '\u2265'],//TODO: equals
				limitsSigns: genArray(defaultLimitsCount).fill(defaultSignType), //limitsSigns: [0, 0, 1],
				b: genArray(defaultLimitsCount).
						map(this.fraction), //b: [14, 15, 12].map(this.fraction),
				iterations: [],
				solution: null,
				noSolutions: false,
			};
		},
		methods: {
			fraction,
			toMinMaxNumberInput({target: input}) {
				if (+input.value < +input.min) {
					input.value = input.min;
				} else if (+input.value > +input.max) {
					input.value = input.max;
				}
				return +input.value;
			},
			changeVarsCount(newCount) {
				let difference = newCount - this.varsCount;
				if (difference > 0) {
					this.c = this.c.concat(genArray(difference).
							map(this.fraction));
					this.a = this.a.map(aiRow => aiRow.concat(genArray(difference).
							map(this.fraction)));
				} else if (difference < 0) {
					this.c = this.c.slice(0, difference);
					this.a = this.a.map(aiRow => aiRow.slice(0, difference));
				}
				this.varsCount = newCount;
			},
			changeLimitsCount(newCount) {
				let difference = newCount - this.limitsCount;
				if (difference > 0) {
					this.a = this.a.concat(genArray(difference).
							map(() => genArray(this.varsCount).
									map(this.fraction)));
					this.limitsSigns = this.limitsSigns.concat(genArray(difference).
							fill(defaultSignType));
					this.b = this.b.concat(genArray(difference).
							map(this.fraction));
				} else if (difference < 0) {
					this.a = this.a.slice(0, difference);
					this.limitsSigns = this.limitsSigns.slice(0, difference);
					this.b = this.b.slice(0, difference);
				}
				this.limitsCount = newCount;
			},
			evalSimplex() {
				this.iterations = [];
				this.solution = null;
				this.noSolutions = false;
				let simplexSolutionGenerator = simplex(this.c, this.M, this.a, this.limitsSigns, this.b);
				let iterateInGenerator = () => {
					let {done, value} = simplexSolutionGenerator.next();
					if (done) {
						if (value.noSolutions) {
							this.noSolutions = true;
						} else {
							this.solution = this.iterations[this.iterations.length - 1];
						}
					} else {
						this.iterations.push(value);
						setTimeout(iterateInGenerator, 5);
					}
				};
				setTimeout(iterateInGenerator, 5);
			},
			getPByIndex(index) {
				if (index === undefined) {
					return ' ';
				}
				return `P${index + 1}`;
			},
			getCByIndex(index) {
				if (index === undefined) {
					return ' ';
				}
				if (index >= this.iterations[0].c.length + this.iterations[0].cb.length) {
					return this.iterations[0].M === 1 ? 'M' : '-M';
				}
				let cj = this.iterations[0].c[index];
				return cj ? cj.toFraction() : 0;
			},
			printX() {
				return `X = (${this.solution.x.map(x => x.toFraction()).join(', ')})`;
			},
			printFX() {
				return `f(x) = ${this.solution.fx.toFraction()}`;
			},
		},
	};
</script>

<style lang="css">
	#app {
		font-family: 'Avenir', Helvetica, Arial, sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}
	
	.setup-label {
		margin-right: 10px;
	}
	
	table {
		border-collapse: collapse;
		text-align: center;
		margin: 5px 0;
	}
	
	.input-table input {
		width: 50px;
		text-align: center;
	}
	
	.input-table button {
		width: 100%;
	}
	
	.eval-button {
		margin: 5px 0;
	}
	
	.simplex-table th, .simplex-table td {
		min-width: 40px;
		border: 1px solid darkgray;
	}
</style>
