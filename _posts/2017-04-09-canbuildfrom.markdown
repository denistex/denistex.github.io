---
layout: post
title: "Тонкости Scala: изучаем CanBuildFrom"
date: 2017-04-09 12:00:00 +0300
excerpt_separator: <!--more-->
tags: [scala, canbuildfrom]
---

В стандартной библиотеке Scala методы коллекций (_map_, _flatMap_, _scan_ и другие) принимают экземпляр типа _CanBuildFrom_ в качестве неявного параметра. В этой статье мы подробно разберём, что это за трейт, как он работает и чем может быть полезен разработчику.

<!--more-->

### Как это работает

Основная цель, которой служит _CanBuildFrom_ - предоставление компилятору типа результата для методов _map_, _flatMap_ и им подобных, о чём подсказывает, например, определение _map_ в трейте _TraversableLike_:

```
def map[B, That](f: A => B)(implicit bf: CanBuildFrom[Repr, B, That]): That
```

Метод возвращает объект типа _That_, который фигурирует в описании только в качестве параметра _CanBuildFrom_. Подходящий экземпляр _CanBuildFrom_ выбирается компилятором на основании типа исходной коллекции _Repr_ и типа результата пользовательской функции _B_. Выбор производится из набора значений, объявленных в объекте _Predef_ и компаньонах коллекций (правила выбора неявных значений заслуживают отдельной статьи и подробно описаны в [спецификации языка](http://www.scala-lang.org/files/archive/spec/2.12/07-implicits.html)).

По сути, при использовании _CanBuildFrom_ происходит такой же вывод типа результата, как и в случае простейшего параметризованного метода:

```
scala> def f[T](x: List[T]): T = x.head
f: [T](x: List[T])T

scala> f(List(3))
res0: Int = 3

scala> f(List(3.14))
res1: Double = 3.14

scala> f(List("Pi"))
res2: String = Pi
```

То есть, при вызове

```
List(1, 2, 3).map(_ * 2)
```

компилятор выберет экземпляр _CanBuildFrom_ из класса _GenTraversableFactory_, который описан следующим образом:

```
class GenericCanBuildFrom[A] extends CanBuildFrom[CC[_], A, CC[A]]
```

и вернёт коллекцию того же типа но с элементами, полученными от пользовательской функции: _CC[A]_. В других случаях компилятор может подобрать более подходящий тип результата, например, для строк:

```
scala> "abc".map(_.toUpper) // Predef.StringCanBuildFrom
res3: String = ABC

scala> "abc".map(_ + "*") // Predef.fallbackStringCanBuildFrom[String]
res4: scala.collection.immutable.IndexedSeq[String] = Vector(a*, b*, c*)

scala> "abc".map(_.toInt) // Predef.fallbackStringCanBuildFrom[Int]
res5: scala.collection.immutable.IndexedSeq[Int] = Vector(97, 98, 99)
```

В первом случае выбран _StringCanBuildFrom_, результат - _String_:

```
implicit val StringCanBuildFrom: CanBuildFrom[String, Char, String]
```

Во втором и третьем - метод _fallbackStringCanBuildFrom_, результат - _IndexedSeq_:

```
implicit def fallbackStringCanBuildFrom[T]: CanBuildFrom[String, T, immutable.IndexedSeq[T]]
```

### Использование breakOut

Рассмотрим использование класса _Map_. Коллекцию такого типа легко преобразовать в _Iterable_, если вернуть из функции преобразования не пару, а единственное значение:

```
scala> Map(1 -> "a", 2 -> "b", 3 -> "c").map(_._2)
res6: scala.collection.immutable.Iterable[String] = List(a, b, c)
```

Но чтобы получить _Map_ из списка пар нужно вызвать метод _toMap_:

```
scala> List('a', 'b', 'c').map(x => x.toInt -> x)
res7: List[(Int, Char)] = List((97,a), (98,b), (99,c))

scala> List('a', 'b', 'c').map(x => x.toInt -> x).toMap
res8: scala.collection.immutable.Map[Int,Char] = Map(97 -> a, 98 -> b, 99 -> c)
```

Либо воспользоваться методом _breakOut_ вместо неявного параметра:

```
scala> import collection.breakOut
import collection.breakOut
scala> List('a', 'b', 'c').map(x => x.toInt -> x)(breakOut)
res9: scala.collection.immutable.IndexedSeq[(Int, Char)] = Vector((97,a), (98,b), (99,c))
```

Метод, как следует из названия, позволяет "вырваться" из границ типа исходной коллекции и предоставить компилятору больше свободы в выборе экземпляра _CanBuildFrom_:

```
def breakOut[From, T, To](implicit b: CanBuildFrom[Nothing, T, To]): CanBuildFrom[From, T, To]
```

Из описания видно, что _breakOut_ не специализирует ни один из трёх параметров, а значит, может быть применён вместо любого экземпляра _CanBuildFrom_. Сам _breakOut_ неявно принимает объект типа _CanBuildFrom_, но параметр _From_ в данном случае заменён на _Nothing_, что позволяет компилятору использовать любой доступный экземпляр _CanBuildFrom_ (так происходит потому что параметр _From_ объявлен как контравариантный, а тип _Nothing_ является потомком любого типа.)

Другими словами, _breakOut_ предоставляет дополнительную "прослойку", которая позволяет компилятору выбирать из всех доступных реализаций _CanBuildFrom_, а не только тех, которые допустимы для типа исходной коллекции. В примере выше это даёт возможность использовать _CanBuildFrom_ из компаньона _Map_, несмотря на то, что изначально мы работали с _List_. Ещё один пример - получение строки из списка символов:

```
scala> List('a', 'b', 'c').map(_.toUpper)
res10: List[Char] = List(A, B, C)

scala> List('a', 'b', 'c').map(_.toUpper)(breakOut)
res11: String = ABC
```

Реализация _CanBuildFrom[String, Char, String]_ объявлена в _Predef_ и потому имеет приоритет над объявлениями в компаньонах коллекций.

### Пример использования со списком _Future_

В качестве небольшого примера использования _CanBuildFrom_ напишем реализацию, которая будет автоматически собирать список _Future_ в один объект, как это делает _Future.sequence_:

```
List[Future[T]] -> Future[List[T]]
```

Для начала заглянем внутрь _CanBuildFrom_. Трейт объявляет два абстрактных метода _apply_, которые возвращают построитель новой коллекции на основе результатов пользовательской функции:

```
def apply(): Builder[Elem, To]
def apply(from: From): Builder[Elem, To]
```

Следовательно, чтобы предоставить собственную реализацию _CanBuildFrom_, нужно подготовить и _Builder_, в котором реализовать методы добавления элемента, очистки буфера и получения результата:

```
class FutureBuilder[A] extends Builder[Future[A], Future[Iterable[A]]] {
  private val buff = ListBuffer[Future[A]]()
  def +=(elem: Future[A]) = { buff += elem; this }
  def clear = buff.clear
  def result = Future.sequence(buff.toSeq)
}
```

Сама реализация _CanBuildFrom_ тривиальна:

```
class FutureCanBuildFrom[A] extends CanBuildFrom[Any, Future[A], Future[Iterable[A]]] {
  def apply = new FutureBuilder[A]
  def apply(from: Any) = apply
}

implicit def futureCanBuildFrom[A] = new FutureCanBuildFrom[A]
```

Проверяем:

```
scala> Range(0, 10).map(x => Future(x * x))
res12: scala.concurrent.Future[Iterable[Int]] = scala.concurrent.impl.Promise$DefaultPromise@360e2cfb
```

Всё работает! Благодаря методу _futureCanBuildFrom_ мы получили непосредственно _Future[Iterable[Int]]_, т.е. преобразование промежуточной коллекции было выполнено автоматически.

__Внимание:__ это просто пример использования _CanBuildFrom_, я не утверждаю, что такое решение нужно использовать в вашем боевом коде или что оно чем-либо лучше обычного оборачивания в _Future.sequence_. Будьте внимательны и не копируйте код в ваш проект без предварительного анализа последствий!

### Заключение

Использование _CanBuildFrom_ тесно связано с неявными параметрами, поэтому чёткое понимание логики выбора значений убережёт вас от потери времени при отладке - не поленитесь заглянуть в спецификацию языка или [Scala FAQ](http://docs.scala-lang.org/tutorials/FAQ/finding-implicits). Компилятор также может помочь и показать, какие неявные значения были выбраны, если собрать программу с флагом _-Xprint:typer_ - это здорово экономит время.

_CanBuildFrom_ - весьма специфичная штука и вам, скорее всего, не придётся тесно работать с ним, если только вы не разрабатываете новые структуры данных. Тем не менее, понимание принципов его работы будет не лишним и позволит лучше разобраться во внутреннем устройстве стандартной библиотеки.

У меня всё, всем спасибо и успехов в изучении Scala!

Исправления и дополнения к статье, как всегда, приветствуются.
