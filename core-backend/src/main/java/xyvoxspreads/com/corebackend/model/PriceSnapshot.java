package xyvoxspreads.com.corebackend.model;

public record PriceSnapshot(
   double bid,
   double ask,
   double bidQty,
   double askQty,
   double markPrice,
   String type,
   long timestamp
) {}
