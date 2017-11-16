import fraction from './utils/fraction';
import genArray from './utils/genArray';

export default function* (c, M, a, limitsSigns, b) {
	
	c = c.map(fraction);
	a = a.map(row => row.map(fraction));
	b = b.map(fraction);
	
	let varsCount = c.length;
	let limitsCount = a.length;
	let cb = [];
	
	a.forEach((row, i) => row.unshift(b[i]));
	
	a.push([fraction(), ...c.map(item => item.neg())]);
	
	let addBasis = (i, scalar = 1) => {
		let newBasis = [];
		for (let ib = 0; ib < a.length; ib++) {
			newBasis[ib] = fraction();
		}
		newBasis[i] = fraction(scalar);
		a.forEach((row, i) => row.push(newBasis[i]));
		cb[i] = a[0].length - 2;
	};
	
	limitsSigns.forEach((sign, i) => {
		addBasis(i, sign === 0 ? 1 : -1);
	});
	
	let firstFakeCIndex = varsCount + limitsCount;
	let fakeBasisCount = 0;
	
	limitsSigns.forEach((sign, i) => {
		if (sign) {
			addBasis(i, 1);
			fakeBasisCount++;
		}
	});
	
	if (fakeBasisCount > 0) {
		a.push([
			...cb.reduce((row, cIndex, i) => {
				if (cIndex < firstFakeCIndex) {
					return row;
				}
				return row.map((item, j) => item.add(a[i][j]).mul(M));
			}, [
				...genArray(1 + firstFakeCIndex).map(fraction),
				...genArray(fakeBasisCount).map(() => fraction(-M))])]);
	}
	
	let isTrouble;
	switch (M) {
		case 1: {
			isTrouble = function(x1, x0 = 0) {
				return x1 > x0;
			};
			break;
		}
		case -1: {
			isTrouble = function(x1, x0 = 0) {
				return x1 < x0;
			};
			break;
		}
	}
	
	let activeDeltaRowIndex = a.length - 1;
	while (true) {
		{
			let {x, fx} = calcXFX();
			yield {
				c,
				M,
				a,
				cb,
				x,
				fx,
			};
		}
		
		let guideColumnIndex;
		let worstDelta = 0;
		for (let j = 1; j < 1 + firstFakeCIndex; j++) {
			if (!isTrouble(a[activeDeltaRowIndex][j], worstDelta)) {
				continue;
			}
			worstDelta = a[activeDeltaRowIndex][j];
			guideColumnIndex = j;
		}
		
		if (!guideColumnIndex) {
			if (fakeBasisCount > 0 && isTrouble(a[activeDeltaRowIndex][0])) {
				return {
					noSolutions: true,
				};
			}
			return {};
		}
		let canBeSolved;
		for (let i = 0; i < limitsCount; i++) {
			if (a[i][guideColumnIndex] > 0) {
				canBeSolved = true;
				break;
			}
		}
		if (!canBeSolved) {
			return {
				noSolutions: true,
			};
		}
		
		let guideRawIndex;
		let smallestDivision = Number.MAX_VALUE;
		for (let i = 0; i < limitsCount; i++) {
			if (a[i][guideColumnIndex] <= 0) {
				continue;
			}
			let division = a[i][0].div(a[i][guideColumnIndex]);
			if (division >= smallestDivision) {
				continue;
			}
			smallestDivision = division;
			guideRawIndex = i;
		}
		
		let newA = genArray(a.length).
				map(() => genArray(a[0].length));
		
		if (cb[guideRawIndex] >= firstFakeCIndex) {
			fakeBasisCount--;
			if (fakeBasisCount === 0) {
				activeDeltaRowIndex--;
				newA.pop();
			}
		}
		
		cb = [...cb];
		cb[guideRawIndex] = guideColumnIndex - 1;
		
		let sRK = a[guideRawIndex][guideColumnIndex];
		for (let i = 0; i < newA.length; i++) {
			let sIK = a[i][guideColumnIndex];
			for (let j = 0; j < newA[0].length; j++) {
				let sRJ = a[guideRawIndex][j];
				newA[i][j] = (a[i][j].mul(sRK).sub(sRJ.mul(sIK))).div(sRK);
			}
		}
		for (let j = 0; j < newA[0].length; j++) {
			let sRJ = a[guideRawIndex][j];
			newA[guideRawIndex][j] = sRJ.div(sRK);
		}
		
		a = newA;
	}
	
	function calcXFX() {
		let x = genArray(firstFakeCIndex).map(fraction);
		cb.forEach((index, i) => x[index] = a[i][0]);
		let fx = c.reduce((sum, k, j) => sum.add(k.mul(x[j])), fraction());
		return {
			x,
			fx,
		};
	}
};
